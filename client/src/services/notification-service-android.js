import {LocalNotifications} from '@capacitor/local-notifications';
import {Haptics} from '@capacitor/haptics';
import {NotificationService} from './notification-service';

class NotificationServiceImplementation extends NotificationService {

    async initialize(url, topics, validContentTypes) {
        await super.initialize(url, topics, validContentTypes);
        this.subscriptions.push(this.eventAggregator.subscribe('haptics-event', async payload => {
            await Haptics.notification(payload);
        }));
    }

    async close() {
        await super.close();
        this.disposeSubscriptions();
    }

    notificationCallback = async(notification) => {
        try {
            let notificationData = JSON.parse(notification.data);
            this.logger.info('Received notification ' + (notificationData.topic ? notificationData.topic + ' ' : '') + notificationData.contentType);
            let valid = this.ajv.validate(this.NotificationSchema, notificationData);
            if (valid) {
                this.eventAggregator.publish('notification' + (notificationData.topic ? '-' + notificationData.topic : ''), notificationData);
                if (notificationData.topic === 'model') {
                    let modelType = this._.lowerFirst(this._.camelCase(notificationData.contentType));
                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                title: this.i18n.tr(
                                    'alerts.notifications.model.' + notificationData.operationType,
                                    // @ts-ignore
                                    {type: modelType}
                                ),
                                body: this.i18n.tr('alerts.notifications.model.message'),
                                id: Math.floor(Math.random() * 10000) + 1
                            }
                        ]
                    });
                }
                this.logger.silly(notificationData);
            } else {
                // @ts-ignore
                this.logger.error(this.ajv.errors);
            }
        } catch (error) {
            this.logger.error(error.message);
        }
    };

}

export {NotificationServiceImplementation};
