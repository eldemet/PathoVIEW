import {BasicViewRouterExtended} from 'library-aurelia/src/prototypes/basic-view-router-extended';
import {inject} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BindingSignaler} from 'aurelia-templating-resources';
import {DialogService} from 'aurelia-dialog';
import {NotificationService} from 'library-aurelia/src/services/notification-service';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {AuthService} from '../services/auth-service';
import {ContextService} from '../services/context-service';
import {AureliaCookie} from 'aurelia-cookie';

@inject(BindingSignaler, DialogService, NotificationService, AuthService, ContextService)
export class App extends BasicViewRouterExtended {

    routes = [
        {
            route: ['', '/empty'],
            name: 'empty',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/empty'),
            nav: false
        },
        {
            route: 'map',
            name: 'map',
            moduleId: PLATFORM.moduleName('./map/map'),
            nav: true,
            title: 'views.map'
        },
        {
            route: 'instructions',
            name: 'instructions',
            moduleId: PLATFORM.moduleName('./instructions/instructions'),
            nav: true,
            title: 'views.instructions'
        },
        {
            route: 'signs',
            name: 'signs',
            moduleId: PLATFORM.moduleName('./signs/signs'),
            nav: true,
            title: 'iso7010.signs'
        },
        {
            route: 'alert',
            name: 'alert',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.alert', {count: 2}),
            settings: {
                detailView: true
            }
        },
        {
            route: 'device',
            name: 'device',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.device', {count: 2}),
            settings: {
                detailView: true
            }
        },
        {
            route: 'components',
            name: 'components',
            moduleId: PLATFORM.moduleName('./components/components'),
            nav: true,
            title: 'views.components'
        }
    ];

    languages = [
        {name: 'English (en)', value: 'en'},
        {name: 'Deutsch (de)', value: 'de'}
    ];

    constructor(bindingSignaler, dialogService, notificationService, authService, contextService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.dialogService = dialogService;
        this.notificationService = notificationService;
        this.authService = authService;
        this.contextService = contextService;
    }

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.title = this.i18n.tr('app');
        config.map(this.routes);
        config.mapUnknownRoutes(PLATFORM.moduleName('library-aurelia/src/views-general/not-found'));
    }

    async attached() {
        super.attached();
        this.isDarkMode = this.responsiveService.isDarkMode();
        this.responsiveService.initialize();
        this.notificationService.registerNotificationListener(this.proxy.get('config').get('baseUrl') + '/api/v1/notification', ['model', 'event']);
        try {
            await this.contextService.initialize(this.authService.getUserId());
        } catch (error) {
            this.logger.warn(error.message);
            this.eventAggregator.publish('app-alert', {type: 'warning', message: 'alerts.noDevice', dismissible: true});
        }
        this.subscriptions.push(this.eventAggregator.subscribe('notification-event', notification => {
            if (notification.contentType === 'toast') {
                this.eventAggregator.publish('toast', {
                    title: notification?.content?.name,
                    body: notification?.content?.description,
                    biIcon: 'alarm',
                    autohide: false,
                    dismissible: true
                });
            } else if (notification.contentType === 'alert') {
                this.dialogService.open({
                    viewModel: PromptDialog,
                    model: {
                        title: notification?.content?.name,
                        question: notification?.content?.description,
                        biIcon: 'warning'
                    },
                    lock: false,
                    overlayDismiss: false,
                    keyboard: ['Escape', 'Enter']
                }).whenClosed(response => {
                    this.logger.info('PropmptDialog was ' + (response.wasCancelled ? 'cancelled' : 'accepted'));
                }).catch(error => {
                    this.logger.error(error);
                });
            }
        }));
        this.subscriptions.push(this.eventAggregator.subscribe('dark-mode-changed', isDarkMode => {
            this.isDarkMode = isDarkMode;
        }));
        this.interval = setInterval(() => this.bindingSignaler.signal('update-logout-in'), 1000);
    }

    detached() {
        super.detached();
        clearInterval(this.interval);
    }

    changeLanguage(language) {
        AureliaCookie.set('lang', language, {});
        window.location.reload();
    }

    openAddDeviceModal(formType, id) {
        let model = {
            kind: 'device',
            formType: 'create',
            objectData: {owner: [this.authService.userInfo.sub]}
        };
        this.dialogService.open({viewModel: AuFormDialog, model: model, modalSize: 'modal-xl'}).whenClosed(response => {
            if (response.wasCancelled) {
                this.logger.debug('Dialog was cancelled!');
            } else {
                this.logger.debug('Dialog was confirmed!');
                this.contextService.initialize();
            }
        });
    }

}
