import {BasicView} from 'library-aurelia/src//prototypes/basic-view';
import {activationStrategy} from 'aurelia-router';
import {RouterService} from 'library-aurelia/src/services/router-service';
import {catchError} from 'library-aurelia/src//decorators';
import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';

/**
 * @extends BasicView
 * @category views-general
 */
@useView(PLATFORM.moduleName('./detail-with-annotations.html'))
class DetailWithAnnotations extends BasicView {

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    determineActivationStrategy(params, routeConfig, navigationInstruction) {
        this.logger.silly('aurelia lifecycle method: determineActivationStrategy');
        let as;
        let uniqueProperty = this.proxy.get(this.type)?.options?.uniqueProperty || '_id';
        if (this.object[uniqueProperty] !== params.id) {
            as = activationStrategy.replace;
        } else {
            as = activationStrategy.noChange;
        }
        return as;
    }

    // @ts-ignore
    async canActivate(params, routeConfig, navigationInstruction) {
        this.type = RouterService.getModelType(params, routeConfig, navigationInstruction);
        this.object = await this.proxy.get(this.type).getObject(params.id);
        return !!this.object;
    }

    @catchError('app-alert')
    async attached() {
        super.attached();
        const schema = await this.proxy.get(this.type).getSchema();
        this.object = await this.proxy.get(this.type).getObject(this.params.id);
        this.schema = schema.discriminator ? await this.proxy.get(this.type).getSchema(this.object[schema.discriminator.propertyName]) : schema;
        this.annotations = (await this.proxy.get('annotation').getObjects()).objects;
    }

    async deleteObject() {
        await this.proxy.get(this.type).deleteObject(this.object);
        this.routerService.navigateToRoute('search', {}, this.router);
    }

    async annotateObject() {
        this.routerService.navigateToRoute('search-comment', {id: this.params.id}, this.router);
    }

}

export {DetailWithAnnotations};
