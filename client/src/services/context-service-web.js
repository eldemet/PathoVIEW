import {observable} from 'aurelia-framework';
import {ContextService} from './context-service';
import {locationUtilities} from '../utilities';

class ContextServiceImplementation extends ContextService {

    @observable timeout = localStorage.getItem('context-aware-alerts-timeout') || '20';

    async enableContextAwareAlerts() {
        await super.enableContextAwareAlerts();
        // @ts-ignore
        this.supportsPageLifecycleAPI = typeof document.onresume === 'object';
        if (this.supportsPageLifecycleAPI) document.addEventListener('resume', this.updateContentAfterPageFreeze);
        this.subscriptions.push(this.eventAggregator.subscribe('alert-closed', alert => {
            this.closedContextAwareAlerts.push(alert.id);
        }));
        await this.startInterval();
        document.addEventListener('visibilitychange', this.visibilityChangeEventListener);
    }

    async disableContextAwareAlerts() {
        await super.disableContextAwareAlerts();
        document.removeEventListener('visibilitychange', this.visibilityChangeEventListener);
        if (this.supportsPageLifecycleAPI) document.removeEventListener('resume', this.updateContentAfterPageFreeze);
        if (this.interval) clearInterval(this.interval);
    }

    async timeoutChanged(timeout) {
        localStorage.setItem('context-aware-alerts-timeout', timeout);
        await this.startInterval();
    }

    visibilityChangeEventListener = async() => {
        if (document.hidden) {
            this.logger.silly('Page is hidden from user view! Clear interval...');
            clearInterval(this.interval);
            this.interval = null;
        } else {
            this.logger.silly('Page is in user view! Set interval...');
            await this.startInterval();
            if (!this.supportsPageLifecycleAPI) {
                await this.updateContentAfterPageFreeze();
            }
        }
    };

    async startInterval() {
        if (this.contextAwareAlertsEnabled) {
            if (this.interval) clearInterval(this.interval);
            let timeout = parseInt(this.timeout, 10) * 1000;
            this.interval = setInterval(async() => await this.update(), timeout);
            await this.update();
        }
    }

    async update() {
        try {
            let location = await locationUtilities.getCurrenPosition('geoJSON');
            if (location) {
                // @ts-ignore
                this.currentLocation = location;
                await this.updateDevice();
                this.checkForAlertsNearCurrentLocation();
            } else {
                throw new Error('Cannot get current position!');
            }
        } catch (error) {
            this.logger.warn(error.message);
        }
    }

}

export {ContextServiceImplementation};
