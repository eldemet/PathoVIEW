import {inject} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BindingSignaler} from 'aurelia-templating-resources';
import {DialogService} from 'aurelia-dialog';
import {AureliaCookie} from 'aurelia-cookie';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {deviceUtilities} from './utilities';
import {NotificationService} from './services/notification-service';
import {ContextService} from './services/context-service';

@inject(BindingSignaler, DialogService, NotificationService, ContextService)
export class App extends BasicViewRouter {

    routes = [
        {
            route: ['', '/home'],
            name: 'home',
            moduleId: PLATFORM.moduleName('./views/home/home'),
            nav: false
        },
        {
            route: 'dashboard',
            name: 'dashboard',
            moduleId: PLATFORM.moduleName('./views/dashboard/dashboard'),
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
                gridColumnsMain: 8,
                gridColumnsDetail: 4,
                detailView: true,
                customSearchView: PLATFORM.moduleName('views-general/search-with-annotations'),
                customDetailView: PLATFORM.moduleName('views-general/annotations')
            }
        },
        {
            route: 'map',
            name: 'map',
            moduleId: PLATFORM.moduleName('./views/map/map'),
            nav: true,
            title: 'views.map'
        },
        {
            route: 'instructions',
            name: 'instructions',
            moduleId: PLATFORM.moduleName('./views/instructions/instructions'),
            nav: true,
            title: 'views.instructions.title'
        },
        {
            route: 'pathogens',
            name: 'pathogens',
            moduleId: PLATFORM.moduleName('./views/pathogens/pathogens'),
            nav: true,
            title: 'views.pathogens.title'
        },
        {
            route: 'cms',
            name: 'cms',
            moduleId: PLATFORM.moduleName('./views/cms/cms'),
            nav: true,
            title: 'views.cms'
        }
    ];

    languages = [{name: 'English (en)', value: 'en'}, {name: 'Deutsch (de)', value: 'de'}];

    /**
     * @param {BindingSignaler} bindingSignaler
     * @param {DialogService} dialogService
     * @param {NotificationService} notificationService
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicViewRouter>} rest
     */
    constructor(bindingSignaler, dialogService, notificationService, contextService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.dialogService = dialogService;
        this.notificationService = notificationService;
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
        this.responsiveService.initialize();
        this.isDarkMode = this.responsiveService.isDarkMode();
        this.subscriptions.push(this.eventAggregator.subscribe('dark-mode-changed', isDarkMode => {
            this.isDarkMode = isDarkMode;
        }));
        await this.contextService.initialize(this.authService.getUserId());
        this.interval = setInterval(() => this.bindingSignaler.signal('update-logout-in'), 1000);
        await this.notificationService.initialize(this.proxy.get('config').get('baseUrl') + '/api/v1/notification', ['model', 'event']);
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
        let model = {type: type, formType: 'create', objectData: {owner: [this.authService.userInfo.sub]}};
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
