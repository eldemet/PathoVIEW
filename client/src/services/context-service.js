import {inject} from 'aurelia-framework';
import {AureliaCookie} from 'aurelia-cookie';
import * as platform from 'platform';
import numeral from 'numeral';
import pick from 'lodash/pick';
import {point} from '@turf/helpers';
import {Proxy} from 'library-aurelia/src/proxy';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
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

    closedContextAwareAlerts = [];

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

    async initialize(config, timeout = 20000) {
        this.config = config;
        this.timeout = timeout;
        await this.loadEmergencyEvents();
        await this.loadAlerts();
        await this.loadMissions();
        await this.initializeCurrentDevice();
        await this.setCurrentWeather();
        numeral.locale(this.i18n.getLocale());
        await this.update();
        this.interval = setInterval(async() => await this.update(), timeout);
        document.addEventListener('visibilitychange', this.visibilityChangeEventListener);
        this.subscriptions.push(this.eventAggregator.subscribe('alert-closed', alert => {
            this.closedContextAwareAlerts.push(alert.id);
        }));
        this.initializeResolve();
    }

    async close() {
        clearInterval(this.interval);
        document.removeEventListener('visibilitychange', this.visibilityChangeEventListener);
        this.disposeSubscriptions();
    }

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
    @catchError('app-alert')
    async loadEmergencyEvents() {
        this.emergencyEventSchema = await this.proxy.get('emergency-event').getSchema();
        this.emergencyEvents = (await this.proxy.get('emergency-event').getObjects()).objects;
        let currentEmergencyEventId = AureliaCookie.get('emergency-event');
        if (currentEmergencyEventId) {
            this.currentEmergencyEvent = this.emergencyEvents.find(x => x.id === currentEmergencyEventId);
        } else {
            this.eventAggregator.publish('app-alert', {
                id: 'noEmergencyEvent',
                type: 'warning',
                message: 'views.dashboard.noEmergencyEvent',
                dismissible: true
            });
        }
    }

    @loadingEvent('app-alert', 'device')
    @catchError('app-alert')
    async initializeCurrentDevice() {
        let user = this.proxy.get('auth').userInfo;
        let devices = (await this.proxy.get('device').getObjects({filter: {owner: user.sub}})).objects;
        if (!Array.isArray(devices) || devices.length === 0) {
            this.logger.warn('No device for user found! Creating new device...');
            let device = {
                id: 'Device:00000',
                type: 'Device',
                name: user.name,
                category: ['sensor'],
                controlledProperty: ['batteryLife', 'location'],
                owner: [user.sub]
            };
            this.currentDevice = await this.proxy.get('device').createObject(device);
        } else {
            this.currentDevice = devices[0];
        }
    }

    @loadingEvent('app-alert', 'alert')
    @catchError()
    async loadAlerts() {
        let alerts = [];
        if (this.currentEmergencyEvent) {
            let query;
            let options = this.proxy.get('alert').options;
            if (this.config?.usePathoware) {
                let pathowareAlertEndpoint = '/api/v1/pathoware/model/' + this.currentEmergencyEvent.scenario + '/alert';
                options.endpoints.getObjects = pathowareAlertEndpoint;
                options.endpoints.createObject = pathowareAlertEndpoint;
                options.endpoints.deleteObject = pathowareAlertEndpoint;
            } else {
                query = {filter: JSON.stringify({alertSource: this.currentEmergencyEvent.id})};
            }
            await this.proxy.get('alert').loadObjects();
            alerts = (await this.proxy.get('alert').getObjects(query)).objects;
        }
        this.alerts = alerts;
    }

    @loadingEvent('app-alert', 'mission')
    @catchError('app-alert')
    async loadMissions(reload) {
        let missions = [];
        if (this.currentEmergencyEvent) {
            await this.proxy.get('mission').initialized();
            let options = this.proxy.get('mission').options;
            options.endpoints.getObjects = options.apiEntrypoint + '/mission?' + stringify({filter: JSON.stringify({refId: this.currentEmergencyEvent.id})});
            await this.proxy.get('mission').loadObjects();
            missions = (await this.proxy.get('mission').getObjects()).objects;
        }
        this.missions = missions;
    }

    @catchError()
    async setCurrentWeather() {
        if (this.currentEmergencyEvent) {
            let coordinates = locationUtilities.getCenter(this.currentEmergencyEvent.location, 'array');
            let url = '/api/v1/weather/current?' + stringify({
                lat: coordinates[1],
                lon: coordinates[0],
                units: 'metric',
                lang: AureliaCookie.get('lang') || 'de'
            });
            this.currentWeather = await this.httpService.fetch('GET', url);
        }
    }

    @catchError()
    async changeEmergencyEvent(emergencyEvent) {
        AureliaCookie.set('emergency-event', emergencyEvent.id, {});
        this.currentEmergencyEvent = emergencyEvent;
        this.eventAggregator.publish('app-alert-dismiss', {id: 'noEmergencyEvent'});
        for (let alert of this.alerts) {
            this.eventAggregator.publish('app-alert-dismiss', {id: alert.id});
        }
        await this.setCurrentWeather();
        await this.loadAlerts();
        await this.loadMissions();
        this.eventAggregator.publish('context-changed', emergencyEvent.id);
    }

    @catchError()
    async updateDevice(location) {
        if (this.currentDevice) {
            let batteryLevel = await deviceUtilities.getBatteryLevel();
            let oldDeviceValues = pick(this.currentDevice, ['name', 'batteryLevel', 'osVersion', 'softwareVersion', 'provider', 'location']);
            let newDeviceValues = {
                name: this.proxy.get('auth')?.userInfo?.name || 'undefined',
                batteryLevel: batteryLevel,
                osVersion: platform.os.toString(),
                softwareVersion: platform.name + ' ' + platform.version,
                provider: platform.manufacturer || '',
                location: location
                // firmwareVersion, hardwareVersion, ipAddress, macAddress, rssi
            };
            if (!this._.isEqual(oldDeviceValues, newDeviceValues)) {
                // @ts-ignore
                this.logger.debug(newDeviceValues);
                try {
                    this.currentDevice = await this.proxy.get('device').updateObject(Object.assign({}, this.currentDevice, newDeviceValues, {dateModified: new Date().toISOString()}), 2000);
                } catch (error) {
                    if (error.status !== 406) {
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
                try {
                    if (!this.closedContextAwareAlerts.includes(alert.id)) {
                        let distanceResult = locationUtilities.distancePointToGeoJSON({from, to: alert.location});
                        let type;
                        let message;
                        let dismissible = true;
                        let properties = distanceResult <= 0 ? {} : {distance: numeral(distanceResult).format('0,0.00') + ' km'};
                        if (distanceResult < 0.5 && (!alert.validTo || alert.validTo > new Date().toISOString())) {
                            if (distanceResult > 0.05) {
                                type = 'warning';
                                message = 'alerts.alertLocationClose';
                            } else {
                                type = 'danger';
                                message = distanceResult <= 0 ? 'alerts.alertLocationEntered' : 'alerts.alertLocationVeryClose';
                            }
                            const payload = {
                                id: alert.id,
                                type: type,
                                message: this.i18n.tr(message),
                                link: {
                                    name: alert.name || alert.description,
                                    href: '#/alert/detail/' + alert.id
                                },
                                properties: Object.assign(properties, {
                                    subCategory: this.i18n.tr('enum.alert.subCategory.' + alert.subCategory),
                                    severity: this.i18n.tr('enum.alert.severity.' + alert.severity.toLowerCase())
                                }),
                                image: `./assets/iso7010/ISO_7010_W${alertUtilities.getISO7010WarningIcon(alert.category, alert.subCategory)}.svg`,
                                dismissible: dismissible
                            };
                            this.eventAggregator.publish('context-aware-alert', payload);
                            this.eventAggregator.publish('app-alert', payload);

                        } else {
                            this.eventAggregator.publish('app-alert-dismiss', {id: alert.id});
                        }
                    }
                } catch (error) {
                    this.logger.debug(error.message);
                }
            }
        }
    }

}

export {ContextService};
