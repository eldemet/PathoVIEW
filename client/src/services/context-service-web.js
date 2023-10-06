import {observable} from 'aurelia-framework';
import {AureliaCookie} from 'aurelia-cookie';
import {ContextService} from './context-service';
import {locationUtilities} from '../utilities';

class ContextServiceImplementation extends ContextService {

    @observable timeout = AureliaCookie.get('context-aware-alerts-timeout') || '20000';

    async enableContextAwareAlerts() {
        await super.enableContextAwareAlerts();
        // @ts-ignore
        this.supportsPageLifecycleAPI = typeof document.onresume === 'object';
        if (this.supportsPageLifecycleAPI) document.addEventListener('resume', this.updateContentAfterPageFreeze);
        this.subscriptions.push(this.eventAggregator.subscribe('alert-closed', alert => {
            this.closedContextAwareAlerts.push(alert.id);
        }));
        await this.update();
        this.interval = setInterval(async() => await this.update(), parseInt(this.timeout, 10));
        document.addEventListener('visibilitychange', this.visibilityChangeEventListener);
    }

    async disableContextAwareAlerts() {
        await super.disableContextAwareAlerts();
        document.removeEventListener('visibilitychange', this.visibilityChangeEventListener);
        if (this.supportsPageLifecycleAPI) document.removeEventListener('resume', this.updateContentAfterPageFreeze);
        if (this.interval) clearInterval(this.interval);
    }

    timeoutChanged(timeout) {
        AureliaCookie.set('context-aware-alerts-timeout', timeout, {});
        if (this.interval) clearInterval(this.interval);
        this.interval = setInterval(async() => await this.update(), parseInt(this.timeout, 10));
    }

    visibilityChangeEventListener = async() => {
        if (document.hidden) {
            this.logger.silly('Page is hidden from user view! Clear interval...');
            clearInterval(this.interval);
            this.interval = null;
        } else {
            this.logger.silly('Page is in user view! Set interval...');
            this.interval = setInterval(async() => await this.update(), parseInt(this.timeout, 10));
            await this.update();
            if (!this.supportsPageLifecycleAPI) {
                await this.updateContentAfterPageFreeze();
            }
        }
    };

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
