import {inject, computedFrom} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {userUtilities, locationUtilities, weatherUtilities} from '../../utilities';
import {NotificationType} from '../../services/notification-service';
// @ts-ignore
import {ContextServiceImplementation} from '../../services/context-service-APP_TARGET';

@inject(ContextServiceImplementation)
class DashboardView extends BasicView {

    openWeatherMapIconUrl = 'https://openweathermap.org/img/wn/';
    currentPosition;

    /**
     * @param {ContextServiceImplementation} contextService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(contextService, ...rest) {
        super(...rest);
        this.contextService = contextService;
        this.userUtilities = userUtilities;
        this.weatherUtilities = weatherUtilities;
    }

    async attached() {
        await super.attached();
        this.interval = setInterval(() => this.bindingSignaler.signal('update-dates'), 1000);
        this.authService = this.proxy.get('auth');
        await this.authService.initialize();
        await this.contextService.initialized;
        this.initialized = true;
        this.currentPosition = await this.getOwnPosition();
    }

    detached() {
        clearInterval(this.interval);
    }

    @computedFrom('contextService.alerts.length')
    get lastAlert() {
        let lastAlert;
        if (this.contextService?.alerts?.length) {
            lastAlert = this.contextService.alerts.reduce((a, b) => (a.dateIssued > b.dateIssued ? a : b));
        }
        return lastAlert;
    }

    @computedFrom('contextService.missions.length')
    get lastMission() {
        let lastMission;
        if (this.contextService?.missions?.length) {
            lastMission = this.contextService.missions.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
        }
        return lastMission;
    }

    @computedFrom('contextService.annotations.length')
    get lastAnnotation() {
        let lastAnnotation;
        if (this.contextService?.annotations?.length) {
            lastAnnotation = this.contextService.annotations.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
        }
        return lastAnnotation;
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

    updateEmergencyEvent() {
        let model = {type: 'emergencyEvent', formType: 'update', objectData: this.contextService.currentEmergencyEvent.id};
        this.dialogService.open({viewModel: AuFormDialog, model: model, modalSize: 'modal-xl'})
            .whenClosed(async response => {
                if (response.wasCancelled) {
                    this.logger.debug('Dialog was cancelled!');
                } else {
                    this.logger.debug('Dialog was confirmed!');
                }
            });
    }

}

export {DashboardView};
