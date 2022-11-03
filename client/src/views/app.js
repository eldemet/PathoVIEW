import {inject} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BindingSignaler} from 'aurelia-templating-resources';
import {DialogService} from 'aurelia-dialog';
import {AureliaCookie} from 'aurelia-cookie';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {deviceUtilities} from '../utilities';
import {NotificationService} from '../services/notification-service';
import {AuthService} from '../services/auth-service';
import {ContextService} from '../services/context-service';

@inject(BindingSignaler, DialogService, NotificationService, AuthService, ContextService)
export class App extends BasicViewRouter {

    routes = [
        {
            route: ['', '/home'],
            name: 'home',
            moduleId: PLATFORM.moduleName('./home/home'),
            nav: false
        },
        {
            route: 'dashboard',
            name: 'dashboard',
            moduleId: PLATFORM.moduleName('./dashboard/dashboard'),
            nav: true,
            title: 'views.dashboard.title'
        },
        {
            route: 'incident',
            name: 'incident',
            moduleId: PLATFORM.moduleName('views-general/search-view-main-detail'),
            nav: true,
            title: this.i18n.tr('model.incident', {count: 2}),
            settings: {
                fluidContainer: true,
                gridColumnsMain: 9,
                gridColumnsDetail: 3,
                detailView: true,
                customSearchView: PLATFORM.moduleName('views-general/search-with-annotations'),
                customDetailView: PLATFORM.moduleName('views-general/annotations')
            }
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
            title: 'views.instructions.title'
        },
        {
            route: 'pathogens',
            name: 'pathogens',
            moduleId: PLATFORM.moduleName('./pathogens/pathogens'),
            nav: true,
            title: 'views.pathogens.title'
        },
        {
            route: 'cms',
            name: 'cms',
            moduleId: PLATFORM.moduleName('./cms/cms'),
            nav: true,
            title: 'views.cms'
        },
        {
            route: 'components',
            name: 'components',
            moduleId: PLATFORM.moduleName('./components/components'),
            nav: true,
            title: 'views.components'
        }
    ];

    languages = [{name: 'English (en)', value: 'en'}, {name: 'Deutsch (de)', value: 'de'}];

    constructor(bindingSignaler, dialogService, notificationService, authService, contextService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.dialogService = dialogService;
        this.notificationService = notificationService;
        this.authService = authService;
        this.contextService = contextService;
        this.deviceUtilities = deviceUtilities;
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
        await this.contextService.initialize(this.authService.getUserId());
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

    openCreateModal(type) {
        let model = {kind: type, formType: 'create', objectData: {owner: [this.authService.userInfo.sub]}};
        this.dialogService.open({viewModel: AuFormDialog, model: model, modalSize: 'modal-xl'})
            .whenClosed(async response => {
                if (response.wasCancelled) {
                    this.logger.debug('Dialog was cancelled!');
                } else {
                    this.logger.debug('Dialog was confirmed!');
                    if (type === 'device') {
                        await this.contextService.loadDevices();
                        this.contextService.setCurrentDevice(response.output.id);
                    } else if (type === 'emergencyEvent') {
                        await this.contextService.loadEmergencyEvents();
                        let emergencyEvent = this.contextService.emergencyEvents.find(x => x.id === response.output.id);
                        await this.contextService.changeEmergencyEvent(emergencyEvent);
                    }
                }
            });
    }

}
