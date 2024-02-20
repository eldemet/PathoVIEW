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
            title: 'model.emergencyEvent',
            settings: {
                i18n: {count: 2},
                detailView: true
            }
        },
        {
            route: 'mission',
            name: 'mission',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: 'model.mission',
            settings: {
                i18n: {count: 2},
                detailView: true
            }
        },
        {
            route: 'alert',
            name: 'alert',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: 'model.alert',
            settings: {
                i18n: {count: 2},
                detailView: true
            }
        },
        {
            route: 'device',
            name: 'device',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: 'model.device',
            settings: {
                i18n: {count: 2},
                detailView: true
            }
        },
        {
            route: 'annotation',
            name: 'annotation',
            moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/search-view'),
            nav: true,
            title: 'model.annotation',
            settings: {
                i18n: {count: 2},
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
