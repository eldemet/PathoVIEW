import {inject} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {activationStrategy} from 'aurelia-router';
import {AuthService} from '../services/auth-service';

/**
 * @extends BasicView
 * @category views-general
 */
@inject(AuthService)
class AnnotationsView extends BasicView {

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(authService, ...rest) {
        super(...rest);
        this.authService = authService;
    }

    determineActivationStrategy(params, routeConfig, navigationInstruction) {
        this.logger.silly('aurelia lifecycle method: determineActivationStrategy');
        return activationStrategy.replace;
    }

    async activate(params, routeConfig, navigationInstruction) {
        super.activate(params, routeConfig, navigationInstruction);
        this.annotations = (await this.proxy.get('annotation').getObjects()).objects;
        this.users = await this.authService.getUsers();
    }

}

export {AnnotationsView};
