import {inject} from 'aurelia-framework';
import {activationStrategy} from 'aurelia-router';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {catchError} from 'library-aurelia/src/decorators';
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

    async attached() {
        await this.loadAnnotations();
    }

    @catchError('app-alert')
    async loadAnnotations() {
        this.users = await this.authService.getUsers();
        this.annotations = (await this.proxy.get('annotation').getObjects()).objects;
    }

}

export {AnnotationsView};
