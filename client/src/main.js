import 'bootstrap';
import {I18N} from 'aurelia-i18n';
import {PLATFORM} from 'aurelia-pal';
import {AureliaFramework} from 'library-aurelia/src/framework';
import {AureliaCookie} from 'aurelia-cookie';
import {EventAggregator} from 'aurelia-event-aggregator';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {ModelServiceBasic} from 'library-aurelia/src/services/model-service-basic';
import {ModelServiceContextAware} from './services/model-service-context-aware';
// @ts-ignore
import environment from '../config/environment.json';
// @ts-ignore
import {AuthServiceImplementation} from './services/auth-service-APP_TARGET';
// @ts-ignore
import {BhapticsServiceImplementation} from './services/bhaptics-service-APP_TARGET';
// @ts-ignore
import {NotificationServiceImplementation} from './services/notification-service-APP_TARGET';
// @ts-ignore
import {ContextServiceImplementation} from './services/context-service-APP_TARGET';

// set model service options
const apiEntrypoint = '/api/v1/model';
const uniqueProperty = 'id';
/** @type {import('library-aurelia/types/types').AjvFormats[]} **/
const formats = ['uri-reference', 'date-time'];
const deviceFormats = [...formats, ...['uri', 'ipv4', 'ipv6']];
const getSchema = ':api-entrypoint/:type/schema-ui';
const getSchemaDevice = getSchema.replace(':api-entrypoint', apiEntrypoint).replace(':type', 'device');
const getObjects = ':api-entrypoint/:type:filter-query';
let alertOptions = {apiEntrypoint, uniqueProperty, formats};
if (environment.usePathoware) {
    let pathowareAlertEndpoint = '/api/v1/pathoware/model/:scenario/alert';
    alertOptions.endpoints = {getSchema, getObjects: pathowareAlertEndpoint, createObject: pathowareAlertEndpoint, deleteObject: pathowareAlertEndpoint};
} else {
    alertOptions.filterProperty = 'alertSource';
    alertOptions.endpoints = {getSchema, getObjects};
}

/**
 * @param {import('aurelia-framework').Aurelia }aurelia
 * @return {Promise<void>}
 */
export async function configure(aurelia) {
    // get instances of required dependencies
    const authService = aurelia.container.get(AuthServiceImplementation);
    const contextService = aurelia.container.get(ContextServiceImplementation);
    const notificationService = aurelia.container.get(NotificationServiceImplementation);
    const httpService = aurelia.container.get(HttpService);
    const eventAggregator = aurelia.container.get(EventAggregator);
    const i18n = aurelia.container.get(I18N);

    // set framework initialization options
    let root = PLATFORM.moduleName('app');
    let globalResources = [
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-date-time'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-map'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-role'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-image'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-severity'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-status'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-image'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-map'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-owner'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-ref'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-role'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-status')
    ];
    let registerServices = [
        authService,
        contextService,
        notificationService,
        new ModelServiceContextAware('alert', alertOptions, httpService, i18n, eventAggregator),
        new ModelServiceContextAware('mission', {apiEntrypoint, uniqueProperty, formats, filterProperty: 'refId', endpoints: {getObjects}}, httpService, i18n, eventAggregator),
        new ModelServiceContextAware('annotation', {apiEntrypoint, uniqueProperty, formats, filterProperty: 'source', endpoints: {getObjects}}, httpService, i18n, eventAggregator),
        new ModelServiceBasic('device', {apiEntrypoint, uniqueProperty, formats: deviceFormats, endpoints: {getSchema: getSchemaDevice}, throwOnValidationError: false}, httpService, i18n, eventAggregator),
        new ModelServiceBasic('emergency-event', {apiEntrypoint, uniqueProperty, formats}, httpService, i18n, eventAggregator)
    ];
    if (environment.enableBhaptics) {
        registerServices.push(aurelia.container.get(BhapticsServiceImplementation));
    }
    let registerPlugins = [
        PLATFORM.moduleName('aurelia-animator-css')
    ];
    let splashScreen = (await import('views/splash-screen.html?raw')).default;

    //TODO remove if library-aurelia is updated
    if (!AureliaCookie.get('search-alert-sort-by')) {
        AureliaCookie.set('search-alert-sort-by', 'dateIssued', {});
        AureliaCookie.set('search-alert-sort-ascending', 'false', {});
    }
    if (!AureliaCookie.get('search-mission-sort-by')) {
        AureliaCookie.set('search-mission-sort-by', 'createdAt', {});
        AureliaCookie.set('search-mission-sort-ascending', 'false', {});
    }

    // redirect to keycloak for login
    await authService.start(environment.keycloak, environment.testing);

    // initialize framework
    await AureliaFramework.initialize(aurelia, {environment, root, globalResources, registerServices, registerPlugins, splashScreen});
}
