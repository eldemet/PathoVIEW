import {observable, inject} from 'aurelia-framework';
import {AureliaCookie} from 'aurelia-cookie';
import * as platform from 'platform';
import numeral from 'numeral';
import pick from 'lodash/pick';
import {point} from '@turf/helpers';
import {Proxy} from 'library-aurelia/src/proxy';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {alertUtilities, deviceUtilities, locationUtilities} from '../utilities';
import {catchError, loadingEvent} from 'library-aurelia/src/decorators';
import {stringify} from 'query-string';

/**
 * @extends BasicService
 * @category services
 */
@inject(Proxy, HttpService)
class ContextService extends BasicService {

    @observable contextAwareAlertsEnabled = AureliaCookie.get('context-aware-alerts-enabled') === 'true';

    initialized = new Promise(resolve => {
        this.initializeResolve = resolve;
    });

    activeContextAwareAlerts = [];
    closedContextAwareAlerts = [];

    /** @type {{type: 'Point', coordinates: [Number, Number]}} */
    currentLocation;

    /**
     * @param {Proxy} proxy
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof import('library-aurelia/src/prototypes/basic-object').BasicObject>} rest
     */
    constructor(proxy, httpService, ...rest) {
        super('context', ...rest);
        this.proxy = proxy;
        this.httpService = httpService;
    }

    async initialize(config) {
        this.config = config;
        await this.loadEmergencyEvents();
        await this.loadAlerts();
        await this.loadMissions();
        await this.loadAnnotations();
        await this.initializeCurrentDevice();
        await this.setCurrentWeather();
        numeral.locale(this.i18n.getLocale());
        this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async payload => {
            let modelType = this._.lowerFirst(this._.camelCase(payload.contentType));
            if (modelType === 'alert') {
                if (payload.operationType === 'delete') {
                    this.dismissActiveContextAwareAlert(payload.content.id);
                } else {
                    this.checkForAlertsNearCurrentLocation();
                }
            }
        }));
        if (this.contextAwareAlertsEnabled) await this.enableContextAwareAlerts();
        this.initializeResolve();
    }

    async close() {
        if (this.contextAwareAlertsEnabled) await this.disableContextAwareAlerts();
        this.disposeSubscriptions();
    }

    async enableContextAwareAlerts() {
        this.logger.debug('context aware alerts enabled');
    }

    async disableContextAwareAlerts() {
        this.logger.debug('context aware alerts disabled');
        for (const id of this.activeContextAwareAlerts) {
            this.eventAggregator.publish('app-alert-dismiss', {id});
        }
        this.activeContextAwareAlerts = [];
    }

    async contextAwareAlertsEnabledChanged(enabled) {
        AureliaCookie.set('context-aware-alerts-enabled', enabled, {});
        if (enabled) {
            await this.enableContextAwareAlerts();
        } else {
            await this.disableContextAwareAlerts();
        }
    }

    @catchError('app-alert')
    async updateContentAfterPageFreeze() {
        await this.loadAlerts(true);
        await this.loadMissions(true);
        await this.loadAnnotations(true);
        this.eventAggregator.publish('context-changed', this.currentEmergencyEvent);
    }

    @loadingEvent('app-alert', 'emergency-event')
    @catchError('app-alert')
    async loadEmergencyEvents() {
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

    @catchError('app-alert')
    async loadAlerts(forceReload) {
        this.alerts = (await this.proxy.get('alert').getObjects(null, null, forceReload)).objects;
    }

    @catchError('app-alert')
    async loadMissions(forceReload) {
        this.missions = (await this.proxy.get('mission').getObjects(null, null, forceReload)).objects;
    }

    @catchError('app-alert')
    async loadAnnotations(forceReload) {
        this.annotations = (await this.proxy.get('annotation').getObjects(null, null, forceReload)).objects;
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
        AureliaCookie.set('scenario', emergencyEvent.scenario, {});
        this.currentEmergencyEvent = emergencyEvent;
        this.eventAggregator.publish('app-alert-dismiss', {id: 'noEmergencyEvent'});
        for (let alert of this.alerts) {
            this.eventAggregator.publish('app-alert-dismiss', {id: alert.id});
        }
        await this.setCurrentWeather();
        await this.loadAlerts();
        await this.loadMissions();
        await this.loadAnnotations();
        this.eventAggregator.publish('context-changed', emergencyEvent);
    }

    @catchError()
    async updateDevice() {
        if (this.currentDevice && this.currentLocation) {
            let batteryLevel = await deviceUtilities.getBatteryLevel();
            let oldDeviceValues = pick(this.currentDevice, ['name', 'batteryLevel', 'osVersion', 'softwareVersion', 'provider', 'location']);
            let newDeviceValues = {
                name: this.proxy.get('auth')?.userInfo?.name || 'undefined',
                batteryLevel: batteryLevel,
                osVersion: platform.os.toString(),
                softwareVersion: platform.name + ' ' + platform.version,
                provider: platform.manufacturer || '',
                location: this.currentLocation
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
    checkForAlertsNearCurrentLocation() {
        if (this.currentLocation && Array.isArray(this.alerts) && this.alerts.length > 0) {
            this.logger.silly('check alerts near current location');
            let from = point(this.currentLocation.coordinates);
            for (let alert of this.alerts) {
                try {
                    if (!this.closedContextAwareAlerts.includes(alert.id)) {
                        let distanceResult = locationUtilities.distancePointToGeoJSON({from, to: alert.location});
                        let type;
                        let message;
                        let dismissible = true;
                        let properties = distanceResult <= 0 ? {} : {distance: numeral(distanceResult).format('0,0.00') + ' km'};
                        if (distanceResult < 0.01 && (!alert.validTo || alert.validTo > new Date().toISOString())) {
                            if (distanceResult > 0) {
                                type = 'warning';
                                message = 'alerts.alertLocationVeryClose';
                            } else {
                                type = 'danger';
                                message = 'alerts.alertLocationEntered';
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
                            this.logger.debug(`distance to alert ${alert.name || alert.description} ${distanceResult}m`);
                            this.activeContextAwareAlerts.push(alert.id);
                        } else {
                            this.dismissActiveContextAwareAlert(alert.id);
                        }
                    }
                } catch (error) {
                    this.logger.debug(error.message);
                }
            }
        }
    }

    dismissActiveContextAwareAlert(id) {
        if (this.activeContextAwareAlerts.includes(id)) {
            this.eventAggregator.publish('app-alert-dismiss', {id});
            this.activeContextAwareAlerts.splice(this.activeContextAwareAlerts.indexOf(id), 1);
        }
    }

    async getRolesOfCurrentEmergencyEvent() {
        let roles = (await this.proxy.get('auth').getObjects()).objects;
        if (this.currentEmergencyEvent && Array.isArray(this.currentEmergencyEvent.roles) && this.currentEmergencyEvent.roles.length > 0) {
            roles = roles.filter(role => this.currentEmergencyEvent.roles.includes(role.id));
        }
        return roles;
    }

    async getUsersOfCurrentEmergencyEvent() {
        let users = await this.proxy.get('auth').getUsers();
        if (this.currentEmergencyEvent && Array.isArray(this.currentEmergencyEvent.roles) && this.currentEmergencyEvent.roles.length > 0) {
            users = users.filter(user => this.currentEmergencyEvent.roles.some(role => user.roles.includes(role)));
        }
        return users;
    }

}

export {ContextService};
