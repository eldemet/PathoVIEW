import 'regenerator-runtime/runtime';
import 'bootstrap';
import {PLATFORM} from 'aurelia-pal';
import {AureliaCookie} from 'aurelia-cookie';
import {AureliaFramework} from 'library-aurelia/src/framework';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {AuthService} from './services/auth-service';
// @ts-ignore
import environment from '../config/environment.json';
import {ModelServiceAsync} from 'library-aurelia/src/services/model-service-async';
import {ModelServiceAsyncUISchema} from './services/model-service-async-ui-schema';

export async function configure(aurelia) {
    let authService = aurelia.container.get(AuthService);
    await authService.initialize(environment.keycloak, environment.testing);
    if (authService?.userInfo?.locale) {
        AureliaCookie.set('lang', authService.userInfo.locale, {});
    }
    let root = PLATFORM.moduleName('app');
    let globalResources = [
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-date-time'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-map'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-image'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-map')
    ];
    const options = {apiEntrypoint: '/api/v1/model', uniqueProperty: 'id', formats: ['uri-reference', 'date-time']};
    let httpService = aurelia.container.get(HttpService);
    let registerServices = [
        authService,
        new ModelServiceAsyncUISchema('alert', options, httpService),
        new ModelServiceAsyncUISchema('device', options, httpService),
        new ModelServiceAsyncUISchema('point-of-interest', options, httpService),
        new ModelServiceAsync('annotation', options, httpService),
        new ModelServiceAsync('action', options, httpService),
        new ModelServiceAsync('emergency-event', options, httpService),
        new ModelServiceAsync('incident', options, httpService),
        new ModelServiceAsync('pathogen', options, httpService)
    ];
    let registerPlugins = [
        PLATFORM.moduleName('aurelia-animator-css')
    ];
    await AureliaFramework.initialize(aurelia, {environment, root, globalResources, registerServices, registerPlugins});
}
