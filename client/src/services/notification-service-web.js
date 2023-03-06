import {NotificationService} from './notification-service';
import {modelUtilities} from '../utilities';

class NotificationServiceImplementation extends NotificationService {

    async initialize(url, topics, validContentTypes) {
        await super.initialize(url, topics, validContentTypes);
        if (topics.includes('model')) {
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

    async close() {
        await super.close();
        this.disposeSubscriptions();
    }

}

export {NotificationServiceImplementation};
