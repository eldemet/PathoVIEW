import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import Ajv from 'ajv';

/**
 * @extends BasicService
 * @category services
 */
class NotificationService extends BasicService {

    static NotificationSchema = {
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
                type: 'string',
                enum: [
                    'different'
                ]
            },
            content: {
                type: 'object'
            },
            operationType: {
                type: 'string'
            },
            senderId: {
                type: 'string',
                'default': 'unknown'
            },
            dateTimeSent: {
                type: 'string',
                format: 'date-time'
            }
        },
        'additionalProperties': false
    };
    notificationListener = null;

    /**
     * @param {...*} rest
     */
    constructor(...rest) {
        super(...rest);
        this.ajv = new Ajv({allErrors: true, strict: false});
    }

    registerNotificationListener(url, topics) {
        if (!!window.EventSource) {
            if (!this.notificationListener) {
                try {
                    if (topics) {
                        url += '?topics=' + topics.join();
                    }
                    this.notificationListener = new EventSource(url);
                    this.notificationListener.onopen = () => {
                        this.logger.info('Registered to notification service!');
                    };
                    this.notificationListener.onerror = (notification) => {
                        let message = '';
                        if (notification.readyState === EventSource.CLOSED) {
                            message = 'The connection to the notification service was closed.';
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
                        for (let topic of topics) {
                            this.notificationListener.addEventListener(topic, notification => {
                                this.notificationCallback(notification);
                            }, false);
                        }
                    }
                } catch (error) {
                    this.logger.error('Could not connect to notification service!');
                }
            }
        } else {
            this.logger.error('Could not connect to notification service! Browser doesn\'t support SSE!');
        }
    }

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
            let valid = this.ajv.validate(NotificationService.NotificationSchema, notificationData);
            if (!valid) {
                this.logger.error(this.ajv.errors);
                //TODO validate if error should be thrown
            }
            this.eventAggregator.publish('notification' + (notificationData.topic ? '-' + notificationData.topic : ''), notificationData);
            this.logger.info('Received notification ' + (notificationData.topic ? notificationData.topic + ' ' : '') + notificationData.contentType);
            this.logger.debug(notificationData);
        } catch (error) {
            this.logger.error(error.message);
        }
    };

}

export {NotificationService};
