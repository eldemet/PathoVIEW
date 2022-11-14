import {BindingEngine, inject} from 'aurelia-framework';
import {BindingSignaler} from 'aurelia-templating-resources';
import {Search} from 'library-aurelia/src/views-general/search';
import {AureliaCookie} from 'aurelia-cookie';

/**
 * @extends Search
 * @category views-general
 */
@inject(BindingEngine, BindingSignaler)
class SearchWithAnnotations extends Search {

    /**
     * @param {BindingEngine} bindingEngine
     * @param {BindingSignaler} bindingSignaler
     * @param {ConstructorParameters<typeof Search>} rest
     */
    constructor(bindingEngine, bindingSignaler, ...rest) {
        super(...rest);
        this.bindingEngine = bindingEngine;
        this.bindingSignaler = bindingSignaler;
    }

    async attached() {
        await super.attached();
        this.subscriptions.push(this.eventAggregator.subscribe('context-changed', async id => {
            await this.initialize();
            this.routerService.navigateToRoute('search', {}, this.router);
        }));
    }

    async initialize() {
        this.routeConfig.settings.filter = {'refId': AureliaCookie.get('emergency-event')};
        await super.initialize();
        this.uniqueProperty = this.proxy.get('annotation')?.options?.uniqueProperty || '_id';
        this.annotable = this.schema?.referencedByModels?.some(e => e.model === 'Annotation');
        if (this.annotable) {
            this.annotations = (await this.proxy.get('annotation').getObjects()).objects;
            this.subscriptions.push(this.bindingEngine.collectionObserver(this.annotations).subscribe(annotations => {
                this.bindingSignaler.signal('annotations-updated');
            }));
        }
    }

    navigateToRoute(route, object, event, router) {
        if (route === 'print') {
            window.open(this.router.generate('search-' + route, {
                id: object[this.uniqueProperty],
                model: this.params.type
            }));
            if (event) event.stopPropagation();
        } else {
            super.navigateToRoute(route, object, event, router);
        }
    }

}

export {SearchWithAnnotations};
