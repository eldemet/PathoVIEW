import {ModelServiceBasicSchema} from './model-service-basic-schema';
import {AureliaCookie} from 'aurelia-cookie';

/**
 * @extends ModelServiceBasicSchema
 * @category services
 */
class ModelServiceContextAware extends ModelServiceBasicSchema {

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
