import {inject, computedFrom} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BindingSignaler} from 'aurelia-templating-resources';
import {AureliaCookie} from 'aurelia-cookie';
import {Offcanvas} from 'bootstrap';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {deviceUtilities} from './utilities';
import {ContextService} from './services/context-service';

@inject(BindingSignaler, ContextService)
export class App extends BasicViewRouter {

    languages = [
        {name: 'English (en)', value: 'en'},
        {name: 'Deutsch (de)', value: 'de'},
        {name: 'български език (bg)', value: 'bg'},
        {name: 'ελληνικά (el)', value: 'el'},
        {name: 'Español (es)', value: 'es'}
    ];

    /**
     * @param {BindingSignaler} bindingSignaler
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicViewRouter>} rest
     */
    constructor(bindingSignaler, contextService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.appConfig = this.proxy.get('config').config;
        this.contextService = contextService;
        this.deviceUtilities = deviceUtilities;
        this.bhapticsServiceEnabled = false;
        /** @type {import('./services/auth-service').AuthService} */
        this.authService = this.proxy.get('auth');
        if (this.appConfig.enableBhaptics) {
            this.bhapticsService = this.proxy.get('bhaptics');
        }
        this.notificationService = this.proxy.get('notification');
    }

    async configureRouter(config, router) {
        super.configureRouter(config, router);
        await this.authService.initialize();
        let routes = [
            {
                route: ['', 'dashboard'],
                name: 'dashboard',
                moduleId: PLATFORM.moduleName('./views/dashboard/dashboard'),
                nav: true,
                title: 'views.dashboard.title'
            },
            {
                route: 'mission',
                name: 'mission',
                moduleId: PLATFORM.moduleName('views-general/search-view-main-detail'),
                nav: true,
                title: 'model.mission',
                settings: {
                    i18n: {count: 2},
                    fluidContainer: true,
                    gridColumnsMain: 8,
                    gridColumnsDetail: 4,
                    detailView: true,
                    deactivate: {
                        delete: !this.authService.hasAccess('mission.delete')
                    },
                    customDetailView: PLATFORM.moduleName('views/mission/detail'),
                    customSearchView: PLATFORM.moduleName('views-general/search-with-annotations'),
                    additionalRoutes: [{
                        route: '/comment/:id',
                        href: 'search-comment',
                        name: 'search-comment',
                        title: 'views.comment',
                        nav: true,
                        viewPorts: {
                            main: {
                                moduleId: PLATFORM.moduleName('views-general/search-with-annotations')
                            },
                            detail: {
                                moduleId: PLATFORM.moduleName('views-general/annotations')
                            }
                        }
                    }]
                }
            },
            {
                route: 'alert',
                name: 'alert',
                moduleId: PLATFORM.moduleName('views-general/search-view-main-detail'),
                nav: true,
                title: 'model.alert',
                settings: {
                    i18n: {count: 2},
                    fluidContainer: true,
                    gridColumnsMain: 8,
                    gridColumnsDetail: 4,
                    detailView: true,
                    deactivate: {
                        create: !this.authService.hasAccess('alert.create'),
                        delete: !this.authService.hasAccess('alert.create'),
                        update: !this.authService.hasAccess('alert.update')
                    },
                    customSearchView: PLATFORM.moduleName('views-general/search-context-aware'),
                    customDetailView: PLATFORM.moduleName('views/alert/detail')
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
                route: '/detail/:model/:id',
                href: 'detail',
                name: 'detail',
                title: 'views.detail',
                nav: false,
                moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/detail')
            },
            {
                route: '/home',
                name: 'home',
                title: 'views.info',
                moduleId: PLATFORM.moduleName('./views/home/home'),
                nav: true
            }
        ];
        if (this.authService.hasAccess('cms.view')) {
            routes.push({
                route: 'cms',
                name: 'cms',
                moduleId: PLATFORM.moduleName('./views/cms/cms'),
                nav: true,
                title: 'views.cms'
            });
        }
        config.title = this.i18n.tr('app');
        config.map(routes);
        config.mapUnknownRoutes(PLATFORM.moduleName('library-aurelia/src/views-general/not-found'));
        config.fallbackRoute('dashboard');
    }

    async attached() {
        super.attached();
        this.responsiveService.initialize();
        await this.contextService.initialize(this.appConfig);
        await this.notificationService.initialize(this.appConfig.baseUrl + '/api/v1/notification', ['model', 'event']);
        this.interval = setInterval(() => this.bindingSignaler.signal('interval-second'), 1000);
        this.dropUpUserMenu = this.responsiveService.matchCondition('md', true);
        this.subscriptions.push(this.eventAggregator.subscribe('device-class-changed', () => {
            this.dropUpUserMenu = this.responsiveService.matchCondition('md', true);
        }));
        this.currentLanguage = this.languages.find(language => language.value === this.i18n.getLocale());
    }

    async detached() {
        await super.detached();
        clearInterval(this.interval);
        if (this.appConfig.enableBhaptics) {
            await this.bhapticsService.close();
        }
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
        let unreadNotifications = 0;
        if (Array.isArray(this.notificationService.notifications)) {
            unreadNotifications = this.notificationService.notifications.filter(n => !n.read).length;
        }
        return unreadNotifications;
    }

    readNotification(notification) {
        notification.read = true;
        this.bindingSignaler.signal('notifications-updated');
    }

    openNotification(notification) {
        this.readNotification(notification);
        let model = notification.contentType;
        let id = notification.content[this.proxy.get(model)?.options?.uniqueProperty || '_id'];
        this.routerService.navigateToRoute('detail', {model, id}, this.router);
        let offcanvas = Offcanvas.getInstance('#offcanvasNotifications');
        if (offcanvas) {
            offcanvas.hide();
        }
    }

    getDate(input) {
        return new Date(input);
    }

}
