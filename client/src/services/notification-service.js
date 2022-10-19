import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {AureliaCookie} from 'aurelia-cookie';
import 'eventsource/example/eventsource-polyfill.js';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {catchError} from 'library-aurelia/src/decorators';

/**
 * @extends BasicService
 * @category services
 */
class NotificationService extends BasicService {

    NotificationSchema = {
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
     * @param {ConstructorParameters<typeof BasicService>} rest
     */
    constructor(...rest) {
        super('notification', ...rest);
        this.ajv = new Ajv({allErrors: true, strict: false});
        addFormats(this.ajv, ['date-time']);
    }

    /**
     * register notification listener
     * @param {String} url url of the server sent event endpoint
     * @param {Array<String>} topics only receive specific topics
     * @param {Array<String>} validContentTypes only allow specific content types
     */
    @catchError('app-alert')
    registerNotificationListener(url, topics, validContentTypes) {
        if (Array.isArray(validContentTypes)) {
            this.NotificationSchema.properties.contentType.enum = validContentTypes;
        }
        try {
            if (topics) url += '?topics=' + topics.join();
            let authToken = AureliaCookie.get('auth_token');
            this.notificationListener = new window.EventSourcePolyfill(url, !this._.isNil(authToken) ? {headers: {'Authorization': 'Bearer ' + authToken}} : undefined);
            this.notificationListener.onopen = () => {
                this.logger.info('Registered to notification service!');
                this.eventAggregator.publish('toast',
                    {
                        biIcon: 'bell',
                        title: 'alerts.notificationService.name',
                        autohide: true,
                        delay: 3000,
                        body: 'alerts.notificationService.registered'
                    }
                );
            };
            this.notificationListener.onerror = (notification) => {
                let message = '';
                if (notification.readyState === window.EventSourcePolyfill.CLOSED) {
                    message = 'alerts.notificationService.connectionClosed';
                    this.eventAggregator.publish('toast',
                        {
                            biIcon: 'bell-slash',
                            title: 'alerts.notificationService.name',
                            dismissible: true,
                            body: 'alerts.notificationService.connectionClosed'
                        }
                    );
                }
                //easily allow logging of other events
                if (message) {
                    this.logger.error(message);
                }
            };
            this.notificationListener.onmessage = notification => {
                this.notificationCallback(notification);
            };
            if (Array.isArray(topics)) {
                this.NotificationSchema.properties.topic.enum = topics;
                for (let topic of topics) {
                    this.notificationListener.addEventListener(topic, notification => {
                        this.notificationCallback(notification);
                    }, false);
                }
            }
        } catch (error) {
            throw new Error('alerts.notificationService.noConnection');
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

    notificationCallback = (notification) => {
        try {
            let notificationData = JSON.parse(notification.data);
            this.logger.info('Received notification ' + (notificationData.topic ? notificationData.topic + ' ' : '') + notificationData.contentType);
            let valid = this.ajv.validate(this.NotificationSchema, notificationData);
            if (valid) {
                this.eventAggregator.publish('notification' + (notificationData.topic ? '-' + notificationData.topic : ''), notificationData);
                this.logger.debug(notificationData);
            } else {
                this.logger.error(this.ajv.errors);
            }
        } catch (error) {
            this.logger.error(error.message);
        }
    };

}

export {NotificationService};
