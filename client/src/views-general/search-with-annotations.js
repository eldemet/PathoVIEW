import {BindingEngine, inject, useView} from 'aurelia-framework';
import {BindingSignaler} from 'aurelia-templating-resources';
import {SearchContextAware} from './search-context-aware';
import {PLATFORM} from 'aurelia-pal';

/**
 * @extends SearchContextAware
 * @category views-general
 */
@useView(PLATFORM.moduleName('./search-with-annotations.html'))
@inject(BindingEngine, BindingSignaler)
class SearchWithAnnotations extends SearchContextAware {

    /**
     * @param {BindingEngine} bindingEngine
     * @param {BindingSignaler} bindingSignaler
     * @param {ConstructorParameters<typeof SearchContextAware>} rest
     */
    constructor(bindingEngine, bindingSignaler, ...rest) {
        super(...rest);
        this.bindingEngine = bindingEngine;
        this.bindingSignaler = bindingSignaler;
    }

    async initialize() {
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

    async navigateToRoute(route, object, event, router) {
        if (route === 'print') {
            window.open(this.router.generate('search-' + route, {
                id: object[this.uniqueProperty],
                model: this.params.type
            }));
            if (event) event.stopPropagation();
        } else {
            await super.navigateToRoute(route, object, event, router);
        }
    }

}

export {SearchWithAnnotations};
