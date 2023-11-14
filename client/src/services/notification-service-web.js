import {NotificationService} from './notification-service';
import {modelUtilities} from '../utilities';

class NotificationServiceImplementation extends NotificationService {

    async initializeService(config) {
        await super.initializeService(config);
        if (config.topics.includes('model')) {
            this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async payload => {
                let modelType = this._.lowerFirst(this._.camelCase(payload.contentType));
                if (modelType === 'alert') {
                    this.eventAggregator.publish('toast', {
                        title: this.i18n.tr(
                            'alerts.notifications.model.' + payload.operationType,
                            // @ts-ignore
                            {type: modelType}
                        ),
                        body: 'alerts.notifications.model.message',
                        biIcon: modelUtilities.getIconByType(modelType),
                        autohide: true,
                        delay: 3000,
                        timestamp: new Date(payload.dateTimeSent)
                    });
                }
            }));
        }
    }

}

export {NotificationServiceImplementation};
