import {inject, computedFrom} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {BindingSignaler} from 'aurelia-templating-resources';
import {userUtilities, locationUtilities, weatherUtilities} from '../../utilities';
import {ContextService} from '../../services/context-service';
import {NotificationType} from '../../services/notification-service';

@inject(BindingSignaler, ContextService)
class DashboardView extends BasicView {

    openWeatherMapIconUrl = 'https://openweathermap.org/img/wn/';
    currentPosition;

    /**
     * @param {BindingSignaler} bindingSignaler
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(bindingSignaler, contextService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.contextService = contextService;
        this.userUtilities = userUtilities;
        this.weatherUtilities = weatherUtilities;
    }

    async attached() {
        await super.attached();
        this.interval = setInterval(() => this.bindingSignaler.signal('update-dates'), 1000);
        this.authService = this.proxy.get('auth');
        this.users = await this.authService.getUsers();
        this.roles = await this.authService.getRoles();
        this.groups = await this.authService.getGroups();
        await this.contextService.initialized;
        this.initialized = true;
        this.currentPosition = await this.getOwnPosition();
    }

    detached() {
        clearInterval(this.interval);
    }

    @computedFrom('contextService.alerts')
    get lastAlert() {
        return this.contextService?.alerts?.at(-1);
    }

    @computedFrom('contextService.missions')
    get lastMission() {
        return this.contextService?.missions?.at(-1);
    }

    getDate(input, format) {
        let date;
        if (input) {
            if (format === 'seconds') {
                date = new Date(input * 1000);
            } else {
                date = new Date(input);
            }
        } else {
            date = new Date();
        }
        return date;
    }

    onlineUsers = u => u.status === 'online';

    async getOwnPosition() {
        let result;
        try {
            result = await locationUtilities.getCurrenPosition();
        } catch (error) {
            this.logger.warn(error.message);
            // eslint-disable-next-line no-undef
            const message = window.isSecureContext && error instanceof GeolocationPositionError ? 'alerts.geoLocationDenied' : 'alerts.geoLocationUnavailable';
            this.eventAggregator.publish('toast', {
                title: 'alerts.geoLocation',
                body: message,
                biIcon: 'geo-alt',
                autohide: false,
                dismissible: true,
                type: NotificationType.Warning
            });
        }
        return result;
    }

    async copyOwnPositionToDashboard() {
        const text = this.currentPosition.lat + ', ' + this.currentPosition.lng;
        await navigator.clipboard.writeText(text);
        this.eventAggregator.publish('toast', {title: 'views.dashboard.copiedPositionToClipboard', body: text, biIcon: 'clipboard', autohide: true});
    }

}

export {DashboardView};
