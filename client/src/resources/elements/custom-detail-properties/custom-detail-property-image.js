import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';

class CustomDetailPropertyImage extends BasicComposable {

    bind(bindingContext, overrideContext) {
        super.bind(bindingContext, overrideContext);
        this.baseUrl = this.proxy.get('config').get('baseUrl');
    }

}

export {CustomDetailPropertyImage};
