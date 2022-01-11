import 'regenerator-runtime/runtime';
import 'bootstrap';
import {PLATFORM} from 'aurelia-pal';
import {AureliaCookie} from 'aurelia-cookie';
import {AureliaFramework} from 'library-aurelia/src/framework';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {AuthService} from './services/auth-service';
import environment from '../config/environment.json';
import {ModelServiceAsyncUISchema} from './services/model-service-async-ui-schema';

export async function configure(aurelia) {
    await AuthService.initialize(environment.keycloak);
    if (AuthService.userInfo.locale) {
        AureliaCookie.set('lang', AuthService.userInfo.locale, {});
    }
    let root = PLATFORM.moduleName('views/app');
    let globalResources = [
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-date-time'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-map'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-image'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-map')
    ];
    const modelOptions = {apiEntrypoint: '/api/v1/model', uniqueProperty: 'id'};
    let httpService = aurelia.container.get(HttpService);
    let registerServices = [
        new ModelServiceAsyncUISchema('alert', modelOptions, httpService),
        new ModelServiceAsyncUISchema('device', modelOptions, httpService)
    ];
    await AureliaFramework.initialize(aurelia, environment, root, globalResources, registerServices);
}
