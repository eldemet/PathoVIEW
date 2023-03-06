import {LocalNotifications} from '@capacitor/local-notifications';
import {Haptics} from '@capacitor/haptics';
import {NotificationService} from './notification-service';

class NotificationServiceImplementation extends NotificationService {

    async initialize(url, topics, validContentTypes) {
        await super.initialize(url, topics, validContentTypes);
        this.subscriptions.push(this.eventAggregator.subscribe('toast', async payload => {
            await Haptics.notification({type: payload.type});
        }));
        if (topics.includes('model')) {
            this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async payload => {
                let modelType = this._.lowerFirst(this._.camelCase(payload.contentType));
                if (modelType === 'alert') {
                    await LocalNotifications.schedule({
                        notifications: [{
                            // @ts-ignore
                            title: this.i18n.tr('alerts.notifications.model.' + payload.operationType, {type: modelType}),
                            body: this.i18n.tr('alerts.notifications.model.message'),
                            id: Math.floor(Math.random() * 10000) + 1
                        }]
                    });
                }
            }));
        }
        this.subscriptions.push(this.eventAggregator.subscribe('context-aware-alert', async payload => {
            await LocalNotifications.schedule({
                notifications: [{
                    title: payload.message,
                    body: payload?.link?.name || '',
                    id: Math.floor(Math.random() * 10000) + 1
                }]
            });
        }));
    }

    async close() {
        await super.close();
        this.disposeSubscriptions();
    }

}

export {NotificationServiceImplementation};
