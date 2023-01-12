import {activationStrategy} from 'aurelia-router';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {catchError} from 'library-aurelia/src/decorators';

/**
 * @extends BasicView
 * @category views-general
 */
class AnnotationsView extends BasicView {

    determineActivationStrategy(params, routeConfig, navigationInstruction) {
        this.logger.silly('aurelia lifecycle method: determineActivationStrategy');
        return activationStrategy.replace;
    }

    async attached() {
        this.authService = this.proxy.get('auth');
        await this.loadAnnotations();
    }

    @catchError('app-alert')
    async loadAnnotations() {
        this.users = await this.authService.getUsers();
        this.annotations = (await this.proxy.get('annotation').getObjects()).objects;
    }

}

export {AnnotationsView};
