import {BasicViewRouterExtended} from 'library-aurelia/src/prototypes/basic-view-router-extended';
import {inject} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {DialogService} from 'aurelia-dialog';
import {NotificationService} from 'library-aurelia/src/services/notification-service';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {ModelServiceAsyncUISchema} from '../services/model-service-async-ui-schema';
import {AureliaCookie} from 'aurelia-cookie';

@inject(NotificationService, DialogService, HttpService)
export class App extends BasicViewRouterExtended {

    routes = [
        {
            route: ['', '/empty'],
            name: 'empty',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/empty'),
            nav: false
        },
        {
            route: 'styles',
            name: 'styles',
            moduleId: PLATFORM.moduleName('./styles/styles'),
            nav: true,
            title: 'views.styles'
        },
        {
            route: 'components',
            name: 'components',
            moduleId: PLATFORM.moduleName('./components/components'),
            nav: true,
            title: 'views.components'
        },
        {
            route: 'map',
            name: 'map',
            moduleId: PLATFORM.moduleName('./map/map'),
            nav: true,
            title: 'views.map'
        },
        {
            route: 'alert',
            name: 'alert',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('views.searchModel', {type: 'model.alert', count: 2}),
            settings: {
                detailView: true
            }
        }
    ];

    languages = [
        {name: 'English (en)', value: 'en'},
        {name: 'Deutsch (de)', value: 'de'}
    ];

    constructor(notificationService, dialogService, httpService, ...rest) {
        super(...rest);
        this.notificationService = notificationService;
        this.dialogService = dialogService;
        this.proxy.registerService('alert', new ModelServiceAsyncUISchema('alert', '/api/v1/model', httpService));
    }

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.title = 'Example Project';
        config.map(this.routes);
        config.mapUnknownRoutes(PLATFORM.moduleName('library-aurelia/src/views-general/not-found'));
    }

    attached() {
        super.attached();
        this.isDarkMode = this.responsiveService.isDarkMode();
        this.responsiveService.initialize();
        this.notificationService.registerNotificationListener('http://localhost:3002/api/v1/notification', ['model', 'event']);
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
    }

    changeLanguage(language) {
        AureliaCookie.set('lang', language, {});
        window.location.reload();
    }

}
