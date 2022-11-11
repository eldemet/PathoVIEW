import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';

@useView(PLATFORM.moduleName('library-aurelia/src/views-general/router-view.html'))
class PathogensView extends BasicViewRouter {

    static routes = [
        {
            route: ['', '/selection'],
            name: 'selection',
            moduleId: PLATFORM.moduleName('./selection'),
            nav: true,
            title: 'views.pathogens.selection'
        },
        {
            route: 'signs',
            name: 'signs',
            moduleId: PLATFORM.moduleName('./signs'),
            nav: true,
            title: 'views.pathogens.signs'
        }
        // {
        //     route: '/:pathogen',
        //     name: 'pathogen',
        //     href: 'pathogen',
        //     moduleId: PLATFORM.moduleName('./detail'),
        //     nav: true,
        //     title: 'views.pathogens.detail'
        // }
    ];

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.map(PathogensView.routes);
    }

}

export {PathogensView};
