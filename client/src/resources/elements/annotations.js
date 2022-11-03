import {bindable} from 'aurelia-framework';
import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';

/**
 * @extends BasicComponent
 * @category resources/elements
 */
class Annotations extends BasicComponent {

    @bindable annotations;
    @bindable users;
    @bindable refId;
    annotationsContainer;
    annotationObject;

    /**
     * @param {ConstructorParameters<typeof BasicComponent>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    bind(bindingContext, overrideContext) {
        super.bind(bindingContext, overrideContext);
        this.subscriptions.push(this.eventAggregator.subscribe('au-form-close', payload => {
            if (payload?.type === 'annotation') {
                this.annotationObject = null;
            }
        }));
    }

    attached() {
        super.attached();
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

    getUser(id) {
        let user;
        if (this.users) {
            user = this.users.find(u => u.id === id);
        }
        return user;
    }

    getAbbreviation(user) {
        let abbreviation = 'ND';
        if (user) {
            let name = user.username;
            if (user.firstName && user.lastName) {
                name = user.firstName + ' ' + user.lastName;
            }
            abbreviation = name.match(/(^\S\S?|\s\S)?/g).map(v => v.trim()).join('').match(/(^\S|\S$)?/g).join('').toLocaleUpperCase();
        }
        return abbreviation;
    }

}

export {Annotations};
