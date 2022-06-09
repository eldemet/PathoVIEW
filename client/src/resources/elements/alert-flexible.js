import {bindable} from 'aurelia-framework';
import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';

/**
 * @extends BasicComponent
 * @category resources
 * @subcategory custom-elements
 *
 * @example
 * <require from="library-aurelia/src/resources/elements/alert"></require>
 *
 * <alert event="app-alert"></alert>
 *
 * @property {String} event @bindable if not set default font awesome home icon is used
 *
 * @listens @bindable event
 */
class AlertFlexible extends BasicComponent {

    @bindable event;
    alerts = [];

    /**
     * @param {ConstructorParameters<typeof BasicComponent>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    attached() {
        super.attached();
        if (this.event) {
            this.subscriptions.push(this.eventAggregator.subscribe(this.event, payload => {
                let alert = this.createAlertEvent(payload);
                let oldAlert = this.alerts.find(x => x.id === alert.id);
                if (oldAlert) {
                    this.alerts[this.alerts.indexOf(oldAlert)] = alert;
                } else {
                    this.alerts.push(alert);
                }
            }));
            this.subscriptions.push(this.eventAggregator.subscribe(this.event + '-dismiss', payload => {
                this.closeAlert(payload?.id);
            }));
        }
    }

    createAlertEvent(payload) {
        let alert;
        if (payload instanceof AlertEvent) {
            alert = payload;
        } else {
            let type = payload.type ? payload.type : 'info';
            let message;
            let translateOptions = payload.translateOptions ? payload.translateOptions : {};
            let dismissible = payload.dismissible === true;
            if (typeof payload === 'string') {
                message = payload;
            } else if (payload instanceof Error) {
                type = 'danger';
                if (payload.message === 'Failed to fetch') {
                    message = 'alerts.general.fetch';
                } else if (payload.status) {
                    message = 'alerts.httpStatusCodes.' + payload.status;
                } else {
                    message = payload.message;
                }
            } else {
                message = payload.message;
            }
            alert = new AlertEvent(payload.id, type, message, payload.properties, payload.image, payload.link, translateOptions, dismissible);
        }
        return alert;
    }

    closeAlert(id = 'default') {
        let oldAlert = this.alerts.find(x => x.id === id);
        if (oldAlert) {
            this.alerts.splice(this.alerts.indexOf(oldAlert), 1);
        }
    }

}

class AlertEvent {

    constructor(id, type, message, properties, image, link, translateOptions, dismissible) {
        this.id = id || 'default';
        this.type = (!type || type === 'loading' || type === 'saving' || type === 'updating') ? 'info' : type;
        this.message = message;
        this.properties = properties;
        this.image = image;
        this.icon = AlertEvent.getIconClassByType(type);
        this.link = link;
        this.translateOptions = translateOptions;
        this.dismissible = dismissible;
    }

    static getIconClassByType(type) {
        let icon;
        switch (type) {
            case 'danger':
                icon = 'bi bi-exclamation-circle';
                break;
            case 'warning':
                icon = 'bi bi-exclamation-triangle';
                break;
            case 'success':
                icon = 'bi bi-check-circle';
                break;
            case 'loading':
                icon = 'spinner-border spinner-border-sm';
                break;
            case 'saving':
                icon = 'spinner-border spinner-border-sm';
                break;
            case 'updating':
                icon = 'spinner-border spinner-border-sm';
                break;
            //info
            default:
                icon = 'bi bi-info-circle';
        }
        return icon;
    }

}

export {AlertFlexible, AlertEvent};
