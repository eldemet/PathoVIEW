import 'regenerator-runtime/runtime';
import 'bootstrap';
import {PLATFORM} from 'aurelia-pal';
import {LogHelper} from 'library-aurelia/src/helpers/log-helper';
import {FormHelper} from 'library-aurelia/src/helpers/form-helper';
import {I18nHelper} from 'library-aurelia/src/helpers/i18n-helper';
import {DialogHelper} from 'library-aurelia/src/helpers/dialog-helper';
import {AuthService} from './services/auth-service';
import environment from './environment';

window.environment = environment;

export async function configure(aurelia) {
    aurelia.use.standardConfiguration();
    aurelia.use.globalResources([
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-date-time'),
        PLATFORM.moduleName('resources/elements/custom-form-items/custom-form-item-map')
    ]);
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-testing'));
    aurelia.use.plugin(PLATFORM.moduleName('aurelia-cookie'));
    LogHelper.initialize(aurelia, environment.testing);
    I18nHelper.initialize(aurelia);
    FormHelper.initialize(aurelia);
    DialogHelper.initialize(aurelia);
    await AuthService.initialize();
    aurelia.start().then(() => aurelia.setRoot(PLATFORM.moduleName('views/app')));
}
