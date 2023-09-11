import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {AureliaCookie} from 'aurelia-cookie';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars

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

const NotificationSchema = {
    type: 'object',
    required: [
        'contentType',
        'content'
    ],
    properties: {
        topic: {
            type: 'string'
        },
        contentType: {
            type: 'string'
        },
        content: {
            type: 'object'
        },
        operationType: {
            type: 'string'
        },
        senderId: {
            type: 'string',
            default: 'unknown'
        },
        dateTimeSent: {
            type: 'string',
            format: 'date-time'
        }
    },
    additionalProperties: false
};

/**
 * @extends BasicService
 * @category services
 */
class NotificationService extends BasicService {

    ignoreList = ['Device'];
    initializeState = 'disconnected';
    notifications = [];
    notificationSound = new Audio('assets/sound-notification.mp3');

    /**
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(...rest) {
        super('notification', ...rest);
        this.ajv = new Ajv({allErrors: true, strict: false});
        addFormats(this.ajv, ['date-time']);
    }

    /**
     * register notification listener
     * @param {String} url url of the server sent event endpoint
     * @param {Array<String>} [topics] only receive specific topics
     * @param {Array<String>} [validContentTypes] only allow specific content types
     */
    async initialize(url, topics, validContentTypes) {
        if (Array.isArray(validContentTypes)) {
            NotificationSchema.properties.contentType.enum = validContentTypes;
        }
        if (topics) url += '?topics=' + topics.join();
        let authToken = AureliaCookie.get('auth_token');
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
        if (Array.isArray(topics)) {
            NotificationSchema.properties.topic.enum = topics;
            for (let topic of topics) {
                this.notificationListener.addEventListener(topic, notification => {
                    this.notificationCallback(notification);
                }, false);
            }
        }
    }

    /**
     * remove notification listener
     */
    removeNotificationListener() {
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

    async close() {
        this.clearNotifications();
        this.removeNotificationListener();
    }

    notificationCallback = (notification) => {
        try {
            let notificationData = JSON.parse(notification.data);
            this.logger.info('Received notification ' + (notificationData.topic ? notificationData.topic + ' ' : '') + notificationData.contentType);
            let valid = this.ajv.validate(NotificationSchema, notificationData);
            if (valid) {
                this.eventAggregator.publish('notification' + (notificationData.topic ? '-' + notificationData.topic : ''), notificationData);
                if (!this.ignoreList.includes(notificationData.contentType)) {
                    this.notifications.push(notificationData);
                    this.notificationSound.play();
                }
            } else {
                // @ts-ignore
                this.logger.error(this.ajv.errors);
            }
        } catch (error) {
            this.logger.error(error.message);
        }
    };

    addNotification(notification) {
        notification.read = false;
        if (this.notifications.length > 98) {
            this.notifications[0] = notification;
        } else {
            this.notifications.push(notification);
        }
    }

    removeNotification(notification) {
        this.notifications.splice(this.notifications.indexOf(notification), 1);
    }

    clearNotifications() {
        this.notifications = [];
    }

}

export {NotificationService, NotificationType};
