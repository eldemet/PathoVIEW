import {computedFrom} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {Offcanvas} from 'bootstrap';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {deviceUtilities} from './utilities';

export class App extends BasicViewRouter {

    languages = [
        {name: 'English (en)', value: 'en'},
        {name: 'Deutsch (de)', value: 'de'},
        {name: 'български език (bg)', value: 'bg'},
        {name: 'ελληνικά (el)', value: 'el'},
        {name: 'Español (es)', value: 'es'}
    ];

    /**
     * @param {ConstructorParameters<typeof BasicViewRouter>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.appConfig = this.proxy.get('config').config;
        this.contextService = this.proxy.get('context');
        this.deviceUtilities = deviceUtilities;
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
                route: '/info',
                name: 'info',
                title: 'views.info.title',
                moduleId: PLATFORM.moduleName('./views/info/info'),
                nav: false
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
        await this.responsiveService.initialize();
        await this.contextService.initialize(this.appConfig);
        await this.notificationService.initialize(this.appConfig.baseUrl + '/api/v1/notification', ['model', 'event']);
        this.interval = setInterval(() => this.bindingSignaler.signal('interval-second'), 1000);
        this.dropUp = this.responsiveService.matchCondition('md', true);
        this.subscriptions.push(this.eventAggregator.subscribe('device-class-changed', () => {
            this.dropUp = this.responsiveService.matchCondition('md', true);
        }));
        this.currentLanguage = this.languages.find(language => language.value === this.i18n.getLocale());
        if (this.appConfig.enableBhaptics && this.bhapticsService.bhapticsServiceEnabled) {
            await this.bhapticsService.initialize();
        }
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
        localStorage.setItem('lang', language);
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
