import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {RouterViewMainDetail} from './router-view-main-detail';
import {activationStrategy} from 'aurelia-router';

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
     * @param {Object} [settings.deactivate]
     * @param {Boolean} [settings.deactivate.create]
     * @param {Boolean} [settings.deactivate.read]
     * @param {Boolean} [settings.deactivate.update]
     * @param {Boolean} [settings.deactivate.delete]
     * @param {Array<Object>} [settings.additionalRoutes]
     * @returns {any}
     */
    getRoutes(settings) {
        let searchView = settings.customSearchView ? settings.customSearchView : PLATFORM.moduleName('library-aurelia/src/views-general/search');
        /** @type {import('aurelia-router').RouteConfig[]} */
        let routes = [];
        routes.push({
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
        });
        if (!settings?.deactivate?.read) {
            let detailView = settings.customDetailView ? settings.customDetailView : PLATFORM.moduleName('library-aurelia/src/views-general/detail');
            routes.push({
                route: '/detail/:id',
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
            });
        }
        if (!settings?.deactivate?.create) {
            routes.push({
                route: '/create',
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
            });
        }
        if (!settings?.deactivate?.update) {
            routes.push({
                route: '/update/:id',
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
            });
        }
        if (Array.isArray(settings.additionalRoutes)) {
            routes.push(...settings.additionalRoutes);
        }
        for (let route of routes) {
            route.settings = Object.assign({}, route.settings, settings);
        }
        return routes;
    }

    determineActivationStrategy(params, routeConfig, navigationInstruction) {
        this.logger.silly('aurelia lifecycle method: determineActivationStrategy');
        let as = activationStrategy.invokeLifecycle;
        if (routeConfig?.name !== this.routeConfig?.name) {
            // @ts-ignore
            as = activationStrategy.replace;
        }
        return as;
    }

    configureRouter(config, router, params, routeConfig) {
        super.configureRouter(config, router);
        config.map(this.getRoutes(routeConfig.settings));
    }

}
