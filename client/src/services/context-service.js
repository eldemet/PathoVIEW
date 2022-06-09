import {inject} from 'aurelia-framework';
import {AureliaCookie} from 'aurelia-cookie';
import * as platform from 'platform';
import numeral from 'numeral';
import {Proxy} from 'library-aurelia/src/proxy';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {FormatDateValueConverter} from 'library-aurelia/src/resources/value-converters/format-date';
import {alertUtilities, deviceUtilities, locationUtilities} from '../utilities';
import {catchError} from 'library-aurelia/src/decorators';
import {point, polygon, multiPolygon} from '@turf/helpers';
import distance from '@turf/distance';
import center from '@turf/center';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';

/**
 * @extends BasicService
 * @category services
 */
@inject(Proxy)
class ContextService extends BasicService {

    constructor(proxy, ...rest) {
        super('context', ...rest);
        this.proxy = proxy;
    }

    @catchError('app-alert', {type: 'warning', message: 'alerts.noDevice', dismissible: true})
    async initialize(userId, timeout = 20000) {
        this.devices = (await this.proxy.get('device').getObjects({filter: {owner: userId}})).objects;
        this.alerts = (await this.proxy.get('alert').getObjects({filter: {alertSource: AureliaCookie.get('emergency-event')}})).objects;
        this.currentDevice = this.getCurrentDevice();
        this.interval = setInterval(async() => await this.update(), timeout);
    }

    async close() {
        clearInterval(this.interval);
    }

    async update() {
        let location = await locationUtilities.getCurrentGeoJSONPoint();
        if (location) {
            await this.updateDevice(location);
            await this.checkForAlertsNearCurrentLocation(location);
        }
    }

    async updateDevice(location) {
        let batteryLevel = await deviceUtilities.getBatteryLevel();
        let oldDeviceValues = this._.pick(this.currentDevice, ['batteryLevel', 'osVersion', 'softwareVersion', 'supportedProtocol', 'provider', 'location']);
        let newDeviceValues = {
            batteryLevel: batteryLevel,
            osVersion: platform.os.toString(),
            softwareVersion: platform.name + ' ' + platform.version,
            supportedProtocol: ['http'],
            provider: platform.manufacturer || '',
            location: location
            // firmwareVersion, hardwareVersion, ipAddress, macAddress, rssi
        };
        if (!this._.isEqual(oldDeviceValues, newDeviceValues)) {
            this.logger.debug(newDeviceValues);
            try {
                this.currentDevice = await this.proxy.get('device').updateObject(Object.assign({}, this.currentDevice, newDeviceValues), 2000);
            } catch (error) {
                if (error.status === 406) {
                    this.currentDevice = newDeviceValues;
                } else {
                    this.logger.error(error.message);
                }
            }
        } else {
            this.logger.debug('Nothing to update for current device!');
        }
    }

    @catchError()
    checkForAlertsNearCurrentLocation(location) {
        let from = point(location.coordinates);
        for (let alert of this.alerts) {
            let distanceResult = distance(from, center(alert.location), {units: 'kilometers'});
            let type;
            let message;
            let properties = {};
            let dismissible = true;
            if ((alert.location.type === 'Polygon' && booleanPointInPolygon(from, polygon(alert.location.coordinates))) ||
                (alert.location.type === 'MultiPolygon' && booleanPointInPolygon(from, multiPolygon(alert.location.coordinates)))) {
                distanceResult = 0;
            }
            if (distanceResult < 1.5) {
                if (distanceResult > 0.75) {
                    type = 'warning';
                    message = 'alerts.alertLocationClose';
                } else {
                    type = 'danger';
                    message = distanceResult === 0 ? 'alerts.alertLocationEntered' : 'alerts.alertLocationVeryClose';
                    properties = distanceResult > 0 ? {distance: numeral(distanceResult).format('0,0.00') + ' km'} : {};
                    dismissible = false;
                }
                numeral.locale(this.i18n.getLocale());
                this.eventAggregator.publish('app-alert',
                    {
                        id: alert.id,
                        type: type,
                        message: this.i18n.tr(message),
                        link: {
                            name: alert.name,
                            href: '#'
                        },
                        properties: Object.assign(properties, {
                            validTo: FormatDateValueConverter.apply(alert.validTo, 'D T', this.i18n.getLocale()),
                            subCategory: this.i18n.tr('enum.alert.subCategory.' + alert.subCategory),
                            severity: this.i18n.tr('enum.alert.severity.' + alert.severity)
                        }),
                        image: `./assets/iso7010/ISO_7010_W${alertUtilities.getISO7010WarningIcon(alert.category, alert.subCategory)}.svg`,
                        dismissible: dismissible
                    });
            } else {
                this.eventAggregator.publish('app-alert-dismiss', {id: alert.id});
            }
        }
    }

    getCurrentDevice() {
        if (!Array.isArray(this.devices) || this.devices.length === 0) {
            throw new Error('No device for user found!');
        }
        let currentDevice = this.devices[0];
        for (let device of this.devices) {
            if (device.osVersion === platform.os.toString() || device.manufacturer === platform.manufacturer) {
                currentDevice = device;
                break;
            }
        }
        return currentDevice;
    }

    getDeviceIcon(device) {
        return deviceUtilities.getDeviceIcon(device);
    }

}

export {ContextService};
