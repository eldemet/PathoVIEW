import {useView} from 'aurelia-framework';
import {PLATFORM} from 'aurelia-pal';
import {activationStrategy} from 'aurelia-router';
import {catchError} from 'library-aurelia/src/decorators';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {AuFormDialog} from 'library-aurelia/src/resources/dialogs/au-form-dialog';
import {RouterService} from 'library-aurelia/src/services/router-service';

/**
 * @extends BasicView
 * @category views-general
 */
@useView(PLATFORM.moduleName('./detail.html'))
class Detail extends BasicView {

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.authService = this.proxy.get('auth');
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
    }

    async deleteObject() {
        try {
            await this.proxy.get(this.type).deleteObjectWithConfirmation(this.object, this.dialogService, this.type);
            this.routerService.navigateToRoute('search', {}, this.router);
        } catch (error) {
            // silently handle cancel
        }
    }

    async navigate(route) {
        this.routerService.navigateToRoute(route, {id: this.params.id}, this.router);
    }

    openCreateModal(type) {
        let objectData = {owner: [this.authService.userInfo.sub], location: this.object.location, address: this.object.address};
        let model = {type: type, formType: 'create', objectData};
        this.dialogService.open({viewModel: AuFormDialog, model: model, modalSize: 'modal-xl'})
            .whenClosed(async response => {
                if (response.wasCancelled) {
                    this.logger.debug('Dialog was cancelled!');
                } else {
                    this.logger.debug('Dialog was confirmed!');
                    this.routerService.navigateToRoute('detail', {model: type, id: response.output.id}, this.router);
                }
            });
    }

}

export {Detail};
