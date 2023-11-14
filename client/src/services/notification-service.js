import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {Type} from '@sinclair/typebox';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';

const NotificationType = {
    /**
     * A notification feedback type indicating that a task has completed successfully
     */
    Success: 'SUCCESS',
    /**
     * A notification feedback type indicating that a task has produced a warning
     */
    Warning: 'WARNING',
    /**
     * A notification feedback type indicating that a task has failed
     */
    Error: 'ERROR'
};

/*eslint new-cap: "off"*/
const NotificationSchema = Type.Optional(Type.Object({
    topic: Type.Optional(Type.String()),
    contentType: Type.String(),
    content: Type.Any(),
    operationType: Type.Optional(Type.String()),
    senderId: Type.Optional(Type.String({default: 'unknown'})),
    dateTimeSent: Type.Optional(Type.String({format: 'date-time'}))
}, {additionalProperties: false}));

/**
 * @extends BasicService
 */
class NotificationService extends BasicService {

    ignoreList = ['Device'];
    initializeState = 'disconnected';
    notifications = [];
    notificationSound = new Audio('assets/sound-notification.mp3');

    /**
     * @param {ConstructorParameters<typeof import('library-aurelia/src/prototypes/basic-object').BasicObject>} rest
     */
    constructor(...rest) {
        super('notification', ...rest);
        this.ajv = new Ajv({allErrors: true, strict: false});
        addFormats(this.ajv, ['date-time']);
    }

    /**
     * register notification listener
     * @param {Object} config
     * @param {String} config.url url of the server sent event endpoint
     * @param {Array<String>} [config.topics] only receive specific topics
     * @param {Array<String>} [config.validContentTypes] only allow specific content types
     */
    async initializeService(config) {
        let url = config.url;
        if (Array.isArray(config.validContentTypes)) {
            NotificationSchema.properties.contentType.enum = config.validContentTypes;
        }
        if (config.topics) url += '?topics=' + config.topics.join();
        let authToken = localStorage.getItem('auth_token');
        const options = !this._.isNil(authToken) ?
            {headers: {'Authorization': 'Bearer ' + authToken, withCredentials: true}} :
            {withCredentials: true}
        ;
        // @ts-ignore
        this.notificationListener = new EventSource(url, options);
        this.notificationListener.onopen = () => {
            this.logger.info('Registered to notification service!');
            this.eventAggregator.publish('haptics-event', {type: NotificationType.Success});
            this.initializeState = 'connected';
        };
        this.notificationListener.onerror = () => {
            if (this.initializeState === 'connected') {
                this.eventAggregator.publish('haptics-event', {type: NotificationType.Error});
                this.initializeState = 'disconnected';
            }
        };
        this.notificationListener.onmessage = notification => {
            this.notificationCallback(notification);
        };
        // TODO add additional check to only show updates of certain scenario
        if (Array.isArray(config.topics)) {
            NotificationSchema.properties.topic.enum = config.topics;
            for (let topic of config.topics) {
                this.notificationListener.addEventListener(topic, notification => {
                    this.notificationCallback(notification);
                }, false);
            }
        }
    }

    async close() {
        await super.close();
        this.clearNotifications();
        if (this.notificationListener) {
            try {
                this.notificationListener.close();
                this.notificationListener = null;
            } catch (error) {
                this.logger.error(error.message);
            }
            this.logger.info('Notification listener removed!');
        }
    }

    notificationCallback = async(/** @type {MessageEvent<String>} */ notification) => {
        try {
            /** @type {import('../types').NotificationSchema} */
            let n = JSON.parse(notification.data);
            this.logger.info('Received notification ' + (n.topic ? n.topic + ' ' : '') + n.contentType);
            let valid = this.ajv.validate(NotificationSchema, n);
            if (valid) {
                //TODO get schema of model, check for schema.options.filterProperty, only send notification if filterProperty === emergencyId
                this.eventAggregator.publish('notification' + (n.topic ? '-' + n.topic : ''), n);
                if (!this.ignoreList.includes(n.contentType) && n.senderId !== localStorage.getItem('userId')) {
                    this.notifications.unshift(n);
                    if (this.notifications.length > 99) {
                        this.notifications.length = 99;
                    }
                    await this.notificationSound.play();
                }
            } else {
                // @ts-ignore
                this.logger.error(this.ajv.errors);
            }
        } catch (error) {
            this.logger.error(error.message);
        }
    };

    removeNotification(notification) {
        this.notifications.splice(this.notifications.indexOf(notification), 1);
    }

    clearNotifications() {
        this.notifications = [];
    }

}

export {NotificationService, NotificationType, NotificationSchema};
