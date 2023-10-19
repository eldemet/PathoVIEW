import {bindable} from 'aurelia-framework';
import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';

/**
 * @extends BasicComponent
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
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.annotationsContainer.scrollTop = this.annotationsContainer.scrollHeight;
    }

    async createAnnotation(kind) {
        this.annotationObject = null;
        await new Promise((resolve) => setTimeout(resolve, 50));
        let emergencyEvent = localStorage.getItem('emergency-event');
        this.annotationObject = {kind, refId: this.refId, source: emergencyEvent};
    }

    async deleteAnnotation(annotation) {
        try {
            await this.proxy.get('annotation').deleteObjectWithConfirmation(annotation, this.dialogService, annotation.kind);
        } catch (error) {
            // silently handle cancel
        }
    }

}

export {Annotations};
