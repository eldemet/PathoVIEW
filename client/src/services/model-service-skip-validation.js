import {ModelServiceBasic} from 'library-aurelia/src/services/model-service-basic';

/**
 * @extends ModelServiceBasic
 * @category services
 */
class ModelServiceSkipValidation extends ModelServiceBasic {

    async loadObjects() {
        let result = await this.httpService.fetch('GET', this.endpoints.getObjects);
        // @ts-ignore
        if (!this.options.skipValidation) {
            this.validate('array-' + this.type, result.objects);
        }
        this.objects = result.objects;
        this.logger.debug(`successfully loaded ${this.type}s (${this.objects.length})`);
    }

}

export {ModelServiceSkipValidation};
