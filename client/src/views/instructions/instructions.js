import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';

@useView(PLATFORM.moduleName('library-aurelia/src/views-general/router-view.html'))
class InstructionsView extends BasicViewRouter {

    static routes = [
        {
            route: ['', '/selection'],
            name: 'selection',
            moduleId: PLATFORM.moduleName('./selection'),
            nav: true,
            title: 'views.instructionsSelection'
        },
        {
            route: '/device/:device',
            name: 'device',
            href: 'device',
            moduleId: PLATFORM.moduleName('./device'),
            nav: true,
            title: 'views.instructionsDevice'
        }
    ];

    configureRouter(config, router, params, routeConfig) {
        super.configureRouter(config, router, params, routeConfig);
        config.map(InstructionsView.routes);
    }

}

export {InstructionsView};
