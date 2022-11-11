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
            title: 'views.instructions.selection'
        },
        {
            route: '/:device/:index',
            name: 'instruction',
            href: 'instruction',
            moduleId: PLATFORM.moduleName('./detail'),
            nav: true,
            title: 'views.instructions.title'
        }
    ];

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.map(InstructionsView.routes);
    }

}

export {InstructionsView};
