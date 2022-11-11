import {PLATFORM} from 'aurelia-pal';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';

export class Cms extends BasicViewRouter {

    routes = [
        {
            route: '',
            redirect: 'emergency-event'
        },
        {
            route: 'emergency-event',
            name: 'emergency-event',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.emergencyEvent', {count: 2}),
            settings: {
                detailView: true
            }
        },
        {
            route: 'incident',
            name: 'incident',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.incident', {count: 2}),
            settings: {
                detailView: true
            }
        },
        {
            route: 'alert',
            name: 'alert',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.alert', {count: 1}),
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
            route: 'poi',
            name: 'point-of-interest',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.pointOfInterest', {count: 2}),
            settings: {
                detailView: true
            }
        },
        {
            route: 'annotation',
            name: 'annotation',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.annotation', {count: 2}),
            settings: {
                detailView: true
            }
        },
        {
            route: 'pathogen',
            name: 'pathogen',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: this.i18n.tr('model.pathogen', {count: 2}),
            settings: {
                detailView: true
            }
        }
    ];

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.title = this.i18n.tr('cms');
        config.map(this.routes);
    }

}
