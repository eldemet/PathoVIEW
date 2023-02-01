import {AureliaCookie} from 'aurelia-cookie';
import {ModelService} from 'library-aurelia/src/services/model-service';

/**
 * @extends ModelService
 * @category services
 */
class ModelServiceAlert extends ModelService {

    scenario;
    objects;

    /**
     * @param type
     * @param options
     * @param httpService
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(type, options, httpService, ...rest) {
        super(type, options, ...rest);
        this.httpService = httpService;
    }

    async initialize() {
        let schema = await this.httpService.fetch('GET', this.options.apiEntrypoint + '/' + this.type + '/schema-ui');
        this.extractSimplifiedSchemas(schema);
        this.logger.debug('successfully loaded schema of ' + this.type + '!');
        this.isInitialized = true;
    }

    async getObjects(query, searchProperties) {
        const scenario = AureliaCookie.get('scenario');
        if (scenario) {
            if (!this.objects || this.scenario !== scenario) {
                this.objects = await this.httpService.fetch('GET', '/api/v1/pathoware/model/' + scenario + '/alert');
                this.logger.debug('successfully loaded alerts');
            }
        } else {
            this.objects = [];
        }
        let adaptedQuery = Object.assign({}, query);
        adaptedQuery.filter = undefined;
        return await super.getObjects(adaptedQuery, searchProperties);
    }

    async createObject(object) {
        const scenario = AureliaCookie.get('scenario');
        let result;
        if (scenario) {
            result = await this.httpService.fetch('POST', '/api/v1/pathoware/model/' + scenario + '/alert', object);
            this.logger.debug('successfully created alert with ' + this.options.uniqueProperty + ' ' + result[this.options.uniqueProperty]);
        } else {
            throw new Error('Can only create Alert for specific scenarios!');
        }
        return result;
    }

    async close() {
        this.disposeSubscriptions();
    }

}

export {ModelServiceAlert};
