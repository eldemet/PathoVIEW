import {BasicViewRouterExtended} from 'library-aurelia/src/prototypes/basic-view-router-extended';
import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';

@useView(PLATFORM.moduleName('library-aurelia/src/views-general/router-view.html'))
class DeviceView extends BasicViewRouterExtended {

    static routes = [
        {
            route: ['', '/overview'],
            name: 'overview',
            href: 'overview',
            moduleId: PLATFORM.moduleName('./device/overview'),
            nav: true,
            title: 'views.instructionsOverview'
        },
        {
            route: 'technology',
            name: 'technology',
            href: 'technology',
            moduleId: PLATFORM.moduleName('./device/technology'),
            nav: true,
            title: 'views.technology'
        },
        {
            route: 'checklist',
            name: 'checklist',
            href: 'checklist',
            moduleId: PLATFORM.moduleName('./device/checklist'),
            nav: true,
            title: 'views.checklist'
        },
        {
            route: 'sampling',
            name: 'sampling',
            href: 'sampling',
            moduleId: PLATFORM.moduleName('./device/sampling'),
            nav: true,
            title: 'views.sampling'
        }
    ];

    configureRouter(config, router, params, routeConfig) {
        super.configureRouter(config, router, params, routeConfig);
        config.map(DeviceView.routes);
    }

}

export {DeviceView};
