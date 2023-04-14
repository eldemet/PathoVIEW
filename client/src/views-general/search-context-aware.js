import {useView} from 'aurelia-framework';
import {Search} from 'library-aurelia/src/views-general/search';
import {PLATFORM} from 'aurelia-pal';

/**
 * @extends Search
 * @category views-general
 */
@useView(PLATFORM.moduleName('library-aurelia/src/views-general/search.html'))
class SearchContextAware extends Search {

    async attached() {
        await super.attached();
        this.subscriptions.push(this.eventAggregator.subscribe('context-changed', async id => {
            await this.initialize();
            this.routerService.navigateToRoute('search', {}, this.router);
        }));
    }

}

export {SearchContextAware};
