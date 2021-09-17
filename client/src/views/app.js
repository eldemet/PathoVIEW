import {BasicViewRouterExtended} from 'library-aurelia/src/prototypes/basic-view-router-extended';
import {inject} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {NotificationService} from '../services/notification-service';
import {DialogService} from 'aurelia-dialog';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';

@inject(NotificationService, DialogService)
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
        }
    ];

    constructor(notificationService, dialogService, ...rest) {
        super(...rest);
        this.notificationService = notificationService;
        this.dialogService = dialogService;
        // this.proxy.registerService('example', new ModelServiceNonPersistent('example', exampleSchema, examples));
    }

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.title = 'Example Project';
        config.map(this.routes);
        config.mapUnknownRoutes(PLATFORM.moduleName('library-aurelia/src/views-general/not-found'));
    }

    attached() {
        super.attached();
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
        this.subscriptions.push(this.eventAggregator.subscribe('pm:create', geoJson => {
            this.logger.debug('pm:create', geoJson);
        }));
        this.subscriptions.push(this.eventAggregator.subscribe('pm:edit', geoJson => {
            this.logger.debug('pm:edit', geoJson);
        }));
        this.subscriptions.push(this.eventAggregator.subscribe('pm:update', geoJson => {
            this.logger.debug('pm:update', geoJson);
        }));
        this.subscriptions.push(this.eventAggregator.subscribe('pm:remove', geoJson => {
            this.logger.debug('pm:remove', geoJson);
        }));
    }

}
