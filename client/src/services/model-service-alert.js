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
        this.logger.debug('Successfully loaded schema of ' + this.type + '!');
        this.isInitialized = true;
    }

    async getObjects(query, searchProperties) {
        const scenario = AureliaCookie.get('scenario');
        if (scenario) {
            if (!this.objects || this.scenario !== scenario) {
                this.objects = await this.httpService.fetch('GET', '/api/v1/pathoware/model/' + scenario + '/alert');
                this.logger.debug('Successfully loaded alerts');
            }
        } else {
            this.objects = [];
        }
        let adaptedQuery = Object.assign({}, query);
        if (adaptedQuery.filter) {
            if (Array.isArray(adaptedQuery.filter.$and)) {
                adaptedQuery.filter.$and = adaptedQuery.filter.$and.filter(o => !o.alertSource);
                if (adaptedQuery.filter.$and.length === 0) {
                    delete adaptedQuery.filter.$and;
                }
            } else {
                delete adaptedQuery.filter.alertSource;
            }
        }
        return await super.getObjects(adaptedQuery, searchProperties);
    }

    async createObject(alert) {
        const scenario = AureliaCookie.get('scenario');
        let result;
        if (scenario) {
            result = await this.httpService.fetch('POST', '/api/v1/pathoware/model/' + scenario + '/alert', alert);
            this.logger.debug('Successfully created alert with ' + this.options.uniqueProperty + ' ' + result[this.options.uniqueProperty]);
        } else {
            throw new Error('Can only create Alert for specific scenarios!');
        }
        return result;
    }

    async deleteObject(alert) {
        const scenario = AureliaCookie.get('scenario');
        let result;
        if (scenario) {
            result = await this.httpService.fetch('DELETE', '/api/v1/pathoware/model/' + scenario + '/alert', alert);
            this.logger.debug('Successfully deleted alert with ' + this.options.uniqueProperty + ' ' + result[this.options.uniqueProperty]);
        } else {
            throw new Error('Can only delete Alert for specific scenarios!');
        }
        return result;
    }

    async close() {
        this.disposeSubscriptions();
    }

}

export {ModelServiceAlert};
