import {inject} from 'aurelia-framework';
import {AureliaCookie} from 'aurelia-cookie';
import * as platform from 'platform';
import numeral from 'numeral';
import {point, polygon, multiPolygon} from '@turf/helpers';
import distance from '@turf/distance';
import center from '@turf/center';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import {Proxy} from 'library-aurelia/src/proxy';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {FormatDateValueConverter} from 'library-aurelia/src/resources/value-converters/format-date';
import {alertUtilities, deviceUtilities, locationUtilities} from '../utilities';
import {catchError} from 'library-aurelia/src/decorators';
import {loadingEvent} from '../decorators';
import {stringify} from 'query-string';

/**
 * @extends BasicService
 * @category services
 */
@inject(Proxy, HttpService)
class ContextService extends BasicService {

    initialized = new Promise(resolve => {
        this.initializeResolve = resolve;
    });

    /**
     * @param {Proxy} proxy
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(proxy, httpService, ...rest) {
        super('context', ...rest);
        this.proxy = proxy;
        this.httpService = httpService;
    }

    async initialize(userId, timeout = 20000) {
        this.userId = userId;
        this.timeout = timeout;
        await this.loadEmergencyEvents();
        await this.loadDevices();
        await this.loadAlerts();
        this.setCurrentEmergencyEvent();
        this.setCurrentDevice();
        await this.setCurrentWeather();
        await this.update();
        this.interval = setInterval(async() => await this.update(), timeout);
        document.addEventListener('visibilitychange', this.visibilityChangeEventListener);
        this.initializeResolve();
    }

    async close() {
        clearInterval(this.interval);
        document.removeEventListener('visibilitychange', this.visibilityChangeEventListener);
    }

    async update() {
        let location = await locationUtilities.getCurrentGeoJSONPoint();
        if (location) {
            await this.updateDevice(location);
            await this.checkForAlertsNearCurrentLocation(location);
        }
    }

    visibilityChangeEventListener = () => {
        if (document.hidden) {
            this.logger.silly('Page is hidden from user view! Clear interval...');
            clearInterval(this.interval);
        } else {
            this.logger.silly('Page is in user view! Set interval...');
            this.interval = setInterval(async() => await this.update(), this.timeout);
        }
    };

    @loadingEvent('app-alert', 'emergency-event')
    @catchError()
    async loadEmergencyEvents() {
        this.emergencyEventSchema = await this.proxy.get('emergency-event').getSchema();
        this.emergencyEvents = (await this.proxy.get('emergency-event').getObjects()).objects;
    }

    @loadingEvent('app-alert', 'device')
    @catchError()
    async loadDevices() {
        this.devices = (await this.proxy.get('device').getObjects({filter: {owner: this.userId}})).objects;
    }

    @loadingEvent('app-alert', 'alert')
    @catchError()
    async loadAlerts() {
        this.alerts = (await this.proxy.get('alert').getObjects({filter: {alertSource: AureliaCookie.get('emergency-event')}})).objects;
    }

    @catchError('app-alert', {
        id: 'noEmergencyEvent',
        type: 'warning',
        message: 'views.dashboard.noEmergencyEvent',
        dismissible: true
    })
    setCurrentEmergencyEvent() {
        let currentEmergencyEventId = AureliaCookie.get('emergency-event');
        if (currentEmergencyEventId) {
            this.currentEmergencyEvent = this.emergencyEvents.find(x => x.id === currentEmergencyEventId);
        } else {
            throw new Error('No emergency event selected!');
        }
    }

    @catchError('app-alert', {id: 'noDevice', type: 'warning', message: 'alerts.noDevice', dismissible: true})
    setCurrentDevice(deviceId) {
        if (!Array.isArray(this.devices) || this.devices.length === 0) {
            throw new Error('No device for user found!');
        }
        let currentDevice = this.devices[0];
        if (deviceId) {
            currentDevice = this.devices.find(x => x.id === deviceId);
        } else {
            for (let device of this.devices) {
                if (device.osVersion === platform.os.toString() || device.manufacturer === platform.manufacturer) {
                    currentDevice = device;
                    break;
                }
            }
        }
        this.currentDevice = currentDevice;
    }

    async setCurrentWeather() {
        if (this.currentEmergencyEvent) {
            let coordinates = center(this.currentEmergencyEvent.location).geometry.coordinates;
            let url = '/api/v1/weather/current?' + stringify({
                lat: coordinates[1],
                lon: coordinates[0],
                units: 'metric',
                lang: AureliaCookie.get('lang') || 'de'
            });
            this.currentWeather = await this.httpService.fetch('GET', url);
        }
    }

    async changeEmergencyEvent(emergencyEvent) {
        AureliaCookie.set('emergency-event', emergencyEvent.id, {});
        this.currentEmergencyEvent = emergencyEvent;
        this.eventAggregator.publish('app-alert-dismiss', {id: 'noEmergencyEvent'});
        for (let alert of this.alerts) {
            this.eventAggregator.publish('app-alert-dismiss', {id: alert.id});
        }
        await this.setCurrentWeather();
        await this.loadAlerts();
        this.eventAggregator.publish('context-changed', emergencyEvent.id);
    }

    async updateDevice(location) {
        if (this.currentDevice) {
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
    }

    @catchError()
    checkForAlertsNearCurrentLocation(location) {
        if (Array.isArray(this.alerts) && this.alerts.length > 0) {
            let from = point(location.coordinates);
            for (let alert of this.alerts) {
                let distanceResult = distance(from, center(alert.location), {units: 'kilometers'});
                let type;
                let message;
                let dismissible = true;
                if ((alert.location.type === 'Polygon' && booleanPointInPolygon(from, polygon(alert.location.coordinates))) ||
                    (alert.location.type === 'MultiPolygon' && booleanPointInPolygon(from, multiPolygon(alert.location.coordinates)))) {
                    distanceResult = 0;
                }
                let properties = distanceResult === 0 ? {} : {distance: numeral(distanceResult).format('0,0.00') + ' km'};
                if (distanceResult < 1.5) {
                    if (distanceResult > 0.75) {
                        type = 'warning';
                        message = 'alerts.alertLocationClose';
                    } else {
                        type = 'danger';
                        message = distanceResult === 0 ? 'alerts.alertLocationEntered' : 'alerts.alertLocationVeryClose';
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
    }

}

export {ContextService};
