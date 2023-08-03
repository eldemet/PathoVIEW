import {bindable} from 'aurelia-framework';
import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';

/**
 * @extends BasicComponent
 * @category resources/elements
 */
class Annotations extends BasicComponent {

    @bindable annotations;
    @bindable refId;
    annotationsContainer;
    annotationObject;

    /**
     * @param {ConstructorParameters<typeof BasicComponent>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.authService = this.proxy.get('auth');
    }

    bind(bindingContext, overrideContext) {
        super.bind(bindingContext, overrideContext);
        this.baseUrl = this.proxy.get('config').get('baseUrl');
        this.subscriptions.push(this.eventAggregator.subscribe('au-form-close', payload => {
            if (payload?.type === 'annotation') {
                this.annotationObject = null;
                this.annotationsContainer.scrollTop = this.annotationsContainer.scrollHeight;
            }
        }));
    }

    async attached() {
        await super.attached();
        await new Promise((resolve) => setTimeout(resolve, 50));
        this.annotationsContainer.scrollTop = this.annotationsContainer.scrollHeight;
    }

    async createAnnotation(kind) {
        this.annotationObject = null;
        await new Promise((resolve) => setTimeout(resolve, 50));
        this.annotationObject = {kind, refId: this.refId};
    }

    async deleteAnnotation(annotation) {
        await this.proxy.get('annotation').deleteObject(annotation);
    }

}

export {Annotations};
