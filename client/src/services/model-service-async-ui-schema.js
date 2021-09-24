import {ModelServiceAsync} from 'library-aurelia/src/services/model-service-async';

/**
 * @extends ModelServiceAsync
 * @category services
 */
class ModelServiceAsyncUISchema extends ModelServiceAsync {

    async initialize() {
        let schema = await this.httpService.fetch('GET', this.apiEntrypoint + '/' + this.type + '/schema-ui');
        this.extractSimplifiedSchemas(schema);
        this.logger.debug('successfully loaded schema of ' + this.type + '!');
        this.isInitialized = true;
    }

}

export {ModelServiceAsyncUISchema};
