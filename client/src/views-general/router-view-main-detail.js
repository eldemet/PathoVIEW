import {inject} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {activationStrategy} from 'aurelia-router';
import {BasicViewRouter} from 'library-aurelia/src/prototypes/basic-view-router';

@inject()
export class RouterViewMainDetail extends BasicViewRouter {

    /**
     *
     * @param {ConstructorParameters<typeof BasicViewRouter>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    configureRouter(config, router) {
        super.configureRouter(config, router);
        config.map({
            route: '',
            name: 'main',
            title: 'views.details',
            nav: false,
            viewPorts: {
                main: {
                    moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/not-implemented')
                },
                detail: {
                    moduleId: PLATFORM.moduleName('library-aurelia/src/views-general/empty')
                }
            }
        });
    }

    determineActivationStrategy(params, routeConfig, navigationInstruction) {
        this.logger.silly('aurelia lifecycle method: determineActivationStrategy');
        return activationStrategy.invokeLifecycle;
    }

    activate(params, routeConfig, navigationInstruction) {
        super.activate(params, routeConfig, navigationInstruction);
        this.navigationInstruction = navigationInstruction;
        this.hide = this.getHide();
        this.maxMainRouteLength = routeConfig.settings.maxMainRouteLength || 2;
        this.subscriptions.push(this.eventAggregator.subscribe('device-class-changed', payload => {
            this.hide = this.getHide();
        }));
    }

    attached() {
        super.attached();
        this.hide = this.getHide();
    }

    getHide() {
        let hide = '';
        if (this.responsiveService.matchCondition('md', false)) {
            if (this.navigationInstruction.fragment.split('/').filter(i => i).length > this.maxMainRouteLength) {
                hide = 'main';
            } else {
                hide = 'detail';
            }
        }
        return hide;
    }

}
