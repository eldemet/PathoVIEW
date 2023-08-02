import {AureliaCookie} from 'aurelia-cookie';
import {ModelServiceBasic} from 'library-aurelia/src/services/model-service-basic';

/**
 * @extends ModelServiceBasic
 * @category services
 */
class ModelServiceContextAware extends ModelServiceBasic {

    /**
     * @param {ConstructorParameters<typeof import('library-aurelia/src/services/model-service-basic').ModelServiceBasic>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    async loadObjects() {
        let objects = [];
        if (AureliaCookie.get('emergency-event')) {
            let result = await this.httpService.fetch('GET', this.options.endpoints.getObjects);
            objects = result.objects || result;
            this.logger.debug(`successfully loaded ${this.type}s (${objects.length})`);
        }
        this.objects = objects;
    }

}

export {ModelServiceContextAware};
