import {useView} from 'aurelia-framework';
import {Search} from 'library-aurelia/src/views-general/search';
import {PLATFORM} from 'aurelia-pal';

/**
 * @extends Search
 */
@useView(PLATFORM.moduleName('library-aurelia/src/views-general/search.html'))
class SearchContextAware extends Search {

    async attached() {
        await super.attached();
        this.subscriptions.push(this.eventAggregator.subscribe('context-changed', async emergencyEvent => {
            this.isInitialized = false;
            await this.initialize();
            this.routerService.navigateToRoute('search', {}, this.router);
        }));
        this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async payload => {
            let modelType = this._.lowerFirst(this._.camelCase(payload.contentType));
            if (this._.camelCase(modelType) === this._.camelCase(this.kind)) {
                await this.loadObjects();
            }
        }));
    }

}

export {SearchContextAware};
