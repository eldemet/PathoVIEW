import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {RouterViewMainDetail} from './router-view-main-detail';

@useView(PLATFORM.moduleName('./router-view-main-detail.html'))
export class SearchView extends RouterViewMainDetail {

    /**
     *
     * @param {Object} settings
     * @param {Number} [settings.gridColumns]
     * @param {Boolean} [settings.detailView]
     * @param {'start'|'end'|'center'|'between'|'around'} [settings.justification='center']
     * @param {Boolean} [settings.fluidContainer]
     * @param {String} [settings.customDetailView]
     * @param {String} [settings.customSearchView]
     * @returns {any}
     */
    getRoutes(settings) {
        let searchView = settings.customSearchView ? settings.customSearchView : PLATFORM.moduleName('library-aurelia/src/views-general/search');
        let detailView = settings.customDetailView ? settings.customDetailView : PLATFORM.moduleName('library-aurelia/src/views-general/detail');
        let routes = [
            {
                route: ['', '/search'],
                name: 'search',
                nav: false,
                viewPorts: {
                    main: {
                        moduleId: searchView
                    },
                    detail: {
                        moduleId: null
                    }
                }
            },
            {
                route: '/search/create',
                name: 'search-create',
                title: 'views.createGeneral',
                nav: true,
                viewPorts: {
                    main: {
                        moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/au-form-view')
                    },
                    detail: {
                        moduleId: null
                    }
                }
            },
            {
                route: '/search/update/:id',
                href: 'search-update',
                name: 'search-update',
                title: 'views.updateGeneral',
                nav: true,
                viewPorts: {
                    main: {
                        moduleId: searchView
                    },
                    detail: {
                        moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/au-form-view')
                    }
                }
            },
            {
                route: '/search/detail/:id',
                href: 'search-detail',
                name: 'search-detail',
                title: 'views.detail',
                nav: true,
                viewPorts: {
                    main: {
                        moduleId: searchView
                    },
                    detail: {
                        moduleId: detailView
                    }
                }
            }
        ];
        for (let route of routes) {
            route.settings = Object.assign({}, route.settings, settings);
        }
        return routes;
    }

    configureRouter(config, router, params, routeConfig) {
        super.configureRouter(config, router);
        config.map(this.getRoutes(routeConfig.settings));
    }

}
