import 'bootstrap';
import {PLATFORM} from 'aurelia-pal';
import {AureliaFramework} from 'library-aurelia/src/framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {I18N} from 'aurelia-i18n';
// @ts-ignore
import environment from '../config/environment.json';
// @ts-ignore
import {AuthServiceImplementation} from './services/auth-service-APP_TARGET';
// @ts-ignore
import {BhapticsServiceImplementation} from './services/bhaptics-service-APP_TARGET';
// @ts-ignore
import {NotificationServiceImplementation} from './services/notification-service-APP_TARGET';
import {ModelServiceAsync} from 'library-aurelia/src/services/model-service-async';
import {ModelServiceAsyncUISchema} from './services/model-service-async-ui-schema';
import {ModelServiceBasicSchema} from './services/model-service-basic-schema';
import {ModelServiceAlert} from './services/model-service-alert';

export async function configure(aurelia) {
    let authService = aurelia.container.get(AuthServiceImplementation);
    await authService.start(environment.keycloak, environment.testing);
    let root = PLATFORM.moduleName('app');
    let globalResources = [
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-date-time'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-map'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-image'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-severity'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-map'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-owner'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-ref')
    ];
    const options = {apiEntrypoint: '/api/v1/model', uniqueProperty: 'id', formats: ['uri-reference', 'date-time']};
    let httpService = aurelia.container.get(HttpService);
    let eventAggregator = aurelia.container.get(EventAggregator);
    let i18n = aurelia.container.get(I18N);
    let registerServices = [
        authService,
        aurelia.container.get(NotificationServiceImplementation),
        environment.usePathoware ? new ModelServiceAlert('alert', options, httpService, i18n, eventAggregator) : new ModelServiceAsyncUISchema('alert', options, httpService, i18n, eventAggregator),
        new ModelServiceAsyncUISchema('device', options, httpService, i18n, eventAggregator),
        new ModelServiceAsyncUISchema('point-of-interest', options, httpService, i18n, eventAggregator),
        new ModelServiceBasicSchema('annotation', options, httpService, i18n, eventAggregator),
        new ModelServiceAsync('emergency-event', options, httpService, i18n, eventAggregator),
        new ModelServiceAsync('mission', options, httpService, i18n, eventAggregator)
    ];
    if (environment.enableBhaptics) {
        registerServices.push(aurelia.container.get(BhapticsServiceImplementation));
    }
    let registerPlugins = [
        PLATFORM.moduleName('aurelia-animator-css')
    ];
    let splashScreen = (await import('views/splash-screen.html?raw')).default;
    await AureliaFramework.initialize(aurelia, {environment, root, globalResources, registerServices, registerPlugins, splashScreen});
}
