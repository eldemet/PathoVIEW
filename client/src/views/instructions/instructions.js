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
            moduleId: PLATFORM.moduleName('./instruction'),
            nav: true,
            title: 'views.instructions.title'
        }
    ];

    configureRouter(config, router, params, routeConfig) {
        super.configureRouter(config, router, params, routeConfig);
        config.map(InstructionsView.routes);
    }

}

function getIconByType(type) {
    let icon;
    if (type === 'checklist') {
        icon = 'list-check';
    } else if (type === 'sampling') {
        icon = 'eyedropper';
    } else if (type === 'commissioning') {
        icon = 'gear';
    } else if (type === 'maintenance') {
        icon = 'wrench';
    }
    return icon;
}

export {InstructionsView, getIconByType};
