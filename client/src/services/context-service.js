import {observable, inject} from 'aurelia-framework';
import numeral from 'numeral';
import pick from 'lodash/pick';
import {point} from '@turf/helpers';
import {Proxy} from 'library-aurelia/src/proxy';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {alertUtilities, locationUtilities} from '../utilities';
import {catchError, loadingEvent} from 'library-aurelia/src/decorators';
import {stringify} from 'query-string';

/**
 * @extends BasicService
 */
@inject(Proxy, HttpService)
class ContextService extends BasicService {

    @observable contextAwareAlertsEnabled = localStorage.getItem('context-aware-alerts-enabled') !== 'false';
    @observable contextAwareAlertsWarningDistance = localStorage.getItem('context-aware-alerts-warning-distance') || '10';

    activeContextAwareAlerts = [];
    closedContextAwareAlerts = [];

    /** @typedef {{type: 'Point', coordinates: [Number, Number]}}  CurrentLocation */
    /** @type {CurrentLocation} */
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

    async initializeService(config) {
        this.config = config;
        await this.loadEmergencyEvents();
        await this.loadAlerts();
        await this.loadMissions();
        await this.loadAnnotations();
        await this.initializeCurrentDevice();
        await this.loadDevices();
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
    }

    async close() {
        await super.close();
        if (this.contextAwareAlertsEnabled) await this.disableContextAwareAlerts();
    }

    async enableContextAwareAlerts() {
        this.logger.debug('context aware alerts enabled');
        this.subscriptions.push(this.eventAggregator.subscribe('alert-closed', alert => {
            this.closedContextAwareAlerts.push(alert.id);
        }));
    }

    async disableContextAwareAlerts() {
        this.logger.debug('context aware alerts disabled');
        for (const id of this.activeContextAwareAlerts) {
            this.eventAggregator.publish('context-aware-alert-dismiss', {id});
        }
        this.activeContextAwareAlerts = [];
        this.closedContextAwareAlerts = [];
    }

    async contextAwareAlertsEnabledChanged(enabled) {
        localStorage.setItem('context-aware-alerts-enabled', enabled);
        if (enabled) {
            await this.enableContextAwareAlerts();
        } else {
            await this.disableContextAwareAlerts();
        }
    }

    async contextAwareAlertsWarningDistanceChanged(warningDistance) {
        localStorage.setItem('context-aware-alerts-warning-distance', warningDistance);
        if (this.contextAwareAlertsEnabled) this.checkForAlertsNearCurrentLocation();
    }

    @catchError('app-alert')
    async updateContentAfterPageFreeze() {
        await this.loadAlerts(true);
        await this.loadMissions(true);
        await this.loadAnnotations(true);
        await this.loadDevices(true);
        this.eventAggregator.publish('context-changed', this.currentEmergencyEvent);
    }

    @loadingEvent('app-alert', 'emergencyEvent')
    async loadEmergencyEvents() {
        this.emergencyEvents = (await this.proxy.get('emergency-event').getObjects()).objects;
        let currentEmergencyEventId = localStorage.getItem('emergency-event');
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

    @catchError('app-alert')
    async loadDevices(forceReload) {
        let userIds = (await this.getUsersOfCurrentEmergencyEvent()).map(u => u.id);
        this.devices = (await this.proxy.get('device').getObjects({filter: {owner: {$in: userIds}}}, forceReload))?.objects;
        this.logger.debug(this.devices);
        if (!this.devices.map(d => d.id).includes(this.currentDevice.id)) {
            this.devices.push(this.currentDevice);
        }
    }

    @loadingEvent('app-alert', 'device')
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
    async loadAlerts(forceReload) {
        this.alerts = (await this.proxy.get('alert').getObjects(null, forceReload))?.objects;
    }

    @loadingEvent('app-alert', 'mission')
    async loadMissions(forceReload) {
        this.missions = (await this.proxy.get('mission').getObjects(null, forceReload))?.objects;
    }

    @loadingEvent('app-alert', 'annotation')
    async loadAnnotations(forceReload) {
        this.annotations = (await this.proxy.get('annotation').getObjects(null, forceReload))?.objects;
    }

    @catchError()
    async setCurrentWeather() {
        if (this.currentEmergencyEvent) {
            let coordinates = locationUtilities.getCenter(this.currentEmergencyEvent.location, 'array');
            let url = '/api/v1/weather/current?' + stringify({
                lat: coordinates[1],
                lon: coordinates[0],
                units: 'metric',
                lang: this.i18n.getLocale()
            });
            this.currentWeather = await this.httpService.fetch('GET', url);
        }
    }

    @catchError()
    async changeEmergencyEvent(emergencyEvent) {
        localStorage.setItem('emergency-event', emergencyEvent.id);
        localStorage.setItem('scenario', emergencyEvent.scenario);
        this.currentEmergencyEvent = emergencyEvent;
        this.eventAggregator.publish('app-alert-dismiss', {id: 'noEmergencyEvent'});
        if (Array.isArray(this.alerts)) {
            for (let alert of this.alerts) {
                this.eventAggregator.publish('app-alert-dismiss', {id: alert.id});
            }
        }
        await this.setCurrentWeather();
        await this.loadAlerts();
        await this.loadMissions();
        await this.loadAnnotations();
        await this.loadDevices();
        this.checkForAlertsNearCurrentLocation();
        this.eventAggregator.publish('context-changed', emergencyEvent);
    }

    @catchError()
    async updateDevice() {
        if (this.currentDevice && this.currentLocation) {
            let oldDeviceValues = pick(this.currentDevice, ['name', 'batteryLevel', 'osVersion', 'softwareVersion', 'provider', 'location']);
            let newDeviceValues = await this.getNewDeviceValues();
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

    /**
     * @abstract
     * @return {Promise<{name: string, batteryLevel: number, osVersion: string, softwareVersion: string, provider: string, location: CurrentLocation}>}
     */
    async getNewDeviceValues() {
        this._notOverridden('getNewDeviceValues()');
        return null;
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
                        let properties = distanceResult <= 0 ? {} : {distance: numeral(distanceResult * 1000).format('0,0.0') + ' m'};
                        const distanceThreshold = parseInt(this.contextAwareAlertsWarningDistance, 10) / 1000;
                        if (distanceResult <= distanceThreshold && (!alert.validTo || alert.validTo > new Date().toISOString())) {
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
        return (await this.proxy.get('auth').getRoles({filter: this.getCurrentEmergencyEventRolesFilter()})).objects;
    }

    async getUsersOfCurrentEmergencyEvent() {
        let filter;
        if (this.currentEmergencyEvent?.roles) {
            filter = {roles: {$in: this.currentEmergencyEvent.roles}};
        }
        return (await this.proxy.get('auth').getUsers({filter})).objects;
    }

    getCurrentEmergencyEventRolesFilter() {
        let filter;
        if (this.currentEmergencyEvent?.roles) {
            filter = {id: {$in: this.currentEmergencyEvent.roles}};
        }
        return filter;
    }

}

export {ContextService};
