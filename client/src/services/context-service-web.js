import {ContextService} from './context-service';
import {locationUtilities} from '../utilities';

class ContextServiceImplementation extends ContextService {

    async initialize(config, timeout) {
        await super.initialize(config, timeout);
        // @ts-ignore
        this.supportsPageLifecycleAPI = typeof document.onresume === 'object';
        if (this.supportsPageLifecycleAPI) {
            document.addEventListener('resume', this.updateContentAfterPageFreeze);
        }
        this.subscriptions.push(this.eventAggregator.subscribe('alert-closed', alert => {
            this.closedContextAwareAlerts.push(alert.id);
        }));
        await this.update();
        this.interval = setInterval(async() => await this.update(), timeout);
        document.addEventListener('visibilitychange', this.visibilityChangeEventListener);
    }

    async close() {
        await super.close();
        document.removeEventListener('visibilitychange', this.visibilityChangeEventListener);
        if (this.supportsPageLifecycleAPI) {
            document.removeEventListener('resume', this.updateContentAfterPageFreeze);
        }
        clearInterval(this.interval);
    }

    visibilityChangeEventListener = () => {
        if (document.hidden) {
            this.logger.silly('Page is hidden from user view! Clear interval...');
            clearInterval(this.interval);
        } else {
            this.logger.silly('Page is in user view! Set interval...');
            this.interval = setInterval(async() => await this.update(), this.timeout);
            if (!this.supportsPageLifecycleAPI) {
                this.updateContentAfterPageFreeze();
            }
        }
    };

    async update() {
        try {
            let location = await locationUtilities.getCurrenPosition('geoJSON');
            if (location) {
                await this.updateDevice(location);
                await this.checkForAlertsNearCurrentLocation(location);
            } else {
                throw new Error('Cannot get current position!');
            }
        } catch (error) {
            this.logger.warn(error.message);
        }
    }

}

export {ContextServiceImplementation};
