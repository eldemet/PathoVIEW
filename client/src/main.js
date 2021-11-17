import 'regenerator-runtime/runtime';
import 'bootstrap';
import {PLATFORM} from 'aurelia-pal';
import {LogHelper} from 'library-aurelia/src/helpers/log-helper';
import {FormHelper} from 'library-aurelia/src/helpers/form-helper';
import {I18nHelper} from 'library-aurelia/src/helpers/i18n-helper';
import {DialogHelper} from 'library-aurelia/src/helpers/dialog-helper';
import {AuthService} from './services/auth-service';
import {AureliaCookie} from 'aurelia-cookie';
import environment from '../config/environment.json';

window.environment = environment;

export async function configure(aurelia) {
    await AuthService.initialize();
    if (AuthService.userInfo.locale) {
        AureliaCookie.set('lang', AuthService.userInfo.locale, {});
    }
    aurelia.use.standardConfiguration();
    aurelia.use.globalResources([
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-date-time'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-map'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-image'),
        PLATFORM.moduleName('resources/elements/custom-detail-properties/custom-detail-property-map')
    ]);
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-cookie'));
    LogHelper.initialize(aurelia, environment.testing);
    I18nHelper.initialize(aurelia);
    FormHelper.initialize(aurelia);
    DialogHelper.initialize(aurelia);
    aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('views/app')));
}
