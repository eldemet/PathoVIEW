import {inject, computedFrom} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BindingSignaler} from 'aurelia-templating-resources';
import {DialogService} from 'aurelia-dialog';
import {AureliaCookie} from 'aurelia-cookie';
import {Offcanvas} from 'bootstrap';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {deviceUtilities} from './utilities';
import {ContextService} from './services/context-service';

@inject(BindingSignaler, DialogService, ContextService)
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
            route: 'alert',
            name: 'alert',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.alert', {count: 1}),
            settings: {
                detailView: true,
                customSearchView: PLATFORM.moduleName('views-general/search-context-aware'),
                customDetailView: PLATFORM.moduleName('views/alert/detail'),
                filter: () => {
                    return {alertSource: AureliaCookie.get('emergency-event') || 'notSet'};
                }
            }
        },
        {
            route: 'mission',
            name: 'mission',
            moduleId: PLATFORM.moduleName('views-general/search-view-main-detail'),
            nav: true,
            title: this.i18n.tr('model.mission', {count: 2}),
            settings: {
                fluidContainer: true,
                gridColumnsMain: 8,
                gridColumnsDetail: 4,
                detailView: true,
                customDetailView: PLATFORM.moduleName('views/mission/detail'),
                customSearchView: PLATFORM.moduleName('views-general/search-with-annotations'),
                filter: () => {
                    return {refId: AureliaCookie.get('emergency-event') || 'notSet'};
                }
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
            nav: false,
            title: 'views.cms'
        },
        {
            route: '/detail/:model/:id',
            href: 'detail',
            name: 'detail',
            title: 'views.detail',
            nav: false,
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/detail')
        }
    ];

    languages = [
        {name: 'English (en)', value: 'en'},
        {name: 'Deutsch (de)', value: 'de'},
        {name: 'български език (bg)', value: 'bg'},
        {name: 'ελληνικά (el)', value: 'el'},
        {name: 'Español (es)', value: 'es'}
    ];

    /**
     * @param {BindingSignaler} bindingSignaler
     * @param {DialogService} dialogService
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicViewRouter>} rest
     */
    constructor(bindingSignaler, dialogService, contextService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.dialogService = dialogService;
        this.contextService = contextService;
        this.deviceUtilities = deviceUtilities;
        this.bhapticsServiceEnabled = false;
        this.authService = this.proxy.get('auth');
        this.bhapticsService = this.proxy.get('bhaptics');
        this.notificationService = this.proxy.get('notification');
    }

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.title = this.i18n.tr('app');
        config.map(this.routes);
        config.mapUnknownRoutes(PLATFORM.moduleName('library-aurelia/src/views-general/not-found'));
        config.fallbackRoute('home');
    }

    async attached() {
        super.attached();
        this.responsiveService.initialize();
        await this.contextService.initialize();
        await this.notificationService.initialize(this.proxy.get('config').get('baseUrl') + '/api/v1/notification', ['model', 'event']);
        this.interval = setInterval(() => this.bindingSignaler.signal('update-logout-in'), 1000);
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
        this.dropUpUserMenu = this.responsiveService.matchCondition('md', true);
        this.subscriptions.push(this.eventAggregator.subscribe('device-class-changed', () => {
            this.dropUpUserMenu = this.responsiveService.matchCondition('md', true);
        }));
        this.currentLanguage = this.languages.find(language => language.value === this.i18n.getLocale());
    }

    async detached() {
        await super.detached();
        clearInterval(this.interval);
        await this.bhapticsService.close();
        await this.notificationService.close();
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
                    if (type === 'emergencyEvent') {
                        await this.contextService.loadEmergencyEvents();
                        let emergencyEvent = this.contextService.emergencyEvents.find(x => x.id === response.output.id);
                        await this.contextService.changeEmergencyEvent(emergencyEvent);
                    }
                }
            });
    }

    async toggleBhapticsService() {
        if (this.bhapticsService.status === 'disabled') {
            await this.bhapticsService.initialize();
        } else {
            await this.bhapticsService.close();
        }
    }

    @computedFrom('notificationService.notifications.length')
    get unreadNotifications() {
        let unreadNotifications = this.notificationService?.notifications?.filter(n => !n.read);
        return unreadNotifications;
    }

    readNotification(notification) {
        notification.read = true;
        this.bindingSignaler.signal('notifications-updated');
        let model = notification.contentType;
        let id = notification.content[this.proxy.get(model)?.options?.uniqueProperty || '_id'];
        this.routerService.navigateToRoute('detail', {model, id}, this.router);
        let offcanvas = Offcanvas.getInstance('#offcanvasNotifications');
        if (offcanvas) {
            offcanvas.hide();
        }
    }

}
