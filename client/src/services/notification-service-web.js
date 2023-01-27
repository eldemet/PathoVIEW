import {NotificationService} from './notification-service';
import {modelUtilities} from '../utilities';

class NotificationServiceImplementation extends NotificationService {

    notificationCallback = (notification) => {
        try {
            let notificationData = JSON.parse(notification.data);
            this.logger.info('Received notification ' + (notificationData.topic ? notificationData.topic + ' ' : '') + notificationData.contentType);
            let valid = this.ajv.validate(this.NotificationSchema, notificationData);
            if (valid) {
                this.eventAggregator.publish('notification' + (notificationData.topic ? '-' + notificationData.topic : ''), notificationData);
                if (notificationData.topic === 'model') {
                    let modelType = this._.lowerFirst(this._.camelCase(notificationData.contentType));
                    this.eventAggregator.publish('toast', {
                        title: this.i18n.tr(
                            'alerts.notifications.model.' + notificationData.operationType,
                            // @ts-ignore
                            {type: modelType}
                        ),
                        body: 'alerts.notifications.model.message',
                        biIcon: modelUtilities.getIconByType(modelType),
                        autohide: true,
                        delay: 3000,
                        timestamp: new Date(notificationData.dateTimeSent)
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
