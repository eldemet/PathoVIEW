import {useView} from 'aurelia-framework';
import {SearchContextAware} from './search-context-aware';
import {PLATFORM} from 'aurelia-pal';

/**
 * @extends SearchContextAware
 */
@useView(PLATFORM.moduleName('./search-with-annotations.html'))
class SearchWithAnnotations extends SearchContextAware {

    async initialize() {
        this.annotations = (await this.proxy.get('annotation').getObjects()).objects;
        this.subscriptions.push(this.bindingEngine.collectionObserver(this.annotations).subscribe(annotations => {
            this.bindingSignaler.signal('annotations-updated');
        }));
        await super.initialize();
    }

}

export {SearchWithAnnotations};
