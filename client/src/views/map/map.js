import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';
import {catchError} from 'library-aurelia/src/decorators';
import {loadingEvent} from '../../decorators';
import {alertUtilities, deviceUtilities} from '../../utilities';

class MapView extends BasicViewExtended {

    constructor(...rest) {
        super(...rest);
    }

    async attached() {
        await this.loadAlerts();
        await this.loadDevices();
        this.setLayers();
    }

    setLayers() {
        this.layers = {overlay: []};
        if (this.alerts) {
            this.layers.overlay.push({
                id: this.i18n.tr('model.alert', {count: 0}),
                type: 'layerGroup',
                layers: this.alerts.map(alert => {
                    return {
                        id: alert.id,
                        type: 'geoJSON',
                        data: alert.location,
                        popupContent: `<h6><i class="${alertUtilities.getSeverityIcon(alert.severity)}"></i> ${alert.name}</h6>
                                           ${this.i18n.tr('enum.alert.category.' + alert.category)}, ${this.i18n.tr('enum.alert.subCategory.' + alert.subCategory)}`
                    };
                })
            });
        }
        if (this.devices) {
            this.layers.overlay.push({
                id: this.i18n.tr('model.device', {count: 0}),
                type: 'layerGroup',
                layers: this.devices.map(device => {
                    return {
                        id: device.id,
                        type: 'geoJSON',
                        data: device.location,
                        popupContent: `<h6><i class="${deviceUtilities.getDeviceIcon(device)}"></i> ${device.name}</h6>
                                           ${this.i18n.tr('enum.device.category.' + device.category)}`
                    };
                })
            });
        }
    }

    @catchError('app-alert', {
        type: 'warning',
        message: 'alerts.general.arrayEmpty',
        translateOptions: {type: 'alert'},
        dismissible: true
    })
    @loadingEvent('app-alert', 'alert')
    async loadAlerts() {
        this.alerts = (await this.proxy.get('alert').getObjects()).objects;
    }

    @catchError('app-alert', {
        type: 'warning',
        message: 'alerts.general.arrayEmpty',
        translateOptions: {type: 'device'},
        dismissible: true
    })
    @loadingEvent('app-alert', 'device')
    async loadDevices() {
        this.devices = (await this.proxy.get('device').getObjects()).objects;
    }

}

export {MapView};
