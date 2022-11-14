import {ModelService} from 'library-aurelia/src/services/model-service';
// eslint-disable-next-line no-unused-vars
import {HttpService} from 'library-aurelia/src/services/http-service';
// eslint-disable-next-line no-unused-vars
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object';

/**
 * @extends ModelService
 * @category services
 */
class ModelServiceBasicSchema extends ModelService {

    /**
     * @param {String} type
     * @param {Object} options
     * @param {String} options.apiEntrypoint
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(type, options, httpService, ...rest) {
        if (!options.apiEntrypoint) throw new Error('Cannot initialize Model since apiEntrypoint is missing!');
        super(type, options, ...rest);
        this.typeKebabCase = this._.kebabCase(this.type);
        this.httpService = httpService;
    }

    async createObject(object) {
        let result = await this.httpService.fetch('POST', this.options.apiEntrypoint + '/' + this.typeKebabCase, object);
        let tmp = this.getObjectById(result[this.options.uniqueProperty]);
        if (tmp === null) {
            if (Array.isArray(this.objects)) {
                this.objects.push(result);
            }
        }
        this.logger.debug('successfully created ' + result[this.options.uniqueProperty]);
        return result;
    }

    async updateObject(object) {
        let result = await this.httpService.fetch('PUT', this.options.apiEntrypoint + '/' + this.typeKebabCase + '/' + object[this.options.uniqueProperty], object);
        let objectToUpdate = this.getObjectById(result[this.options.uniqueProperty]);
        if (objectToUpdate) {
            Object.assign(objectToUpdate, result);
        }
        this.logger.debug('successfully updated ' + result[this.options.uniqueProperty]);
        return result;
    }

    async deleteObject(object) {
        let result = await this.httpService.fetch('DELETE', this.options.apiEntrypoint + '/' + this.typeKebabCase + '/' + object[this.options.uniqueProperty], object);
        let objectToDelete = this.getObjectById(result[this.options.uniqueProperty]);
        if (objectToDelete && Array.isArray(this.objects)) {
            let index = this.objects.indexOf(objectToDelete);
            if (index > -1) {
                this.objects.splice(index, 1);
            }
        }
        this.logger.debug('successfully deleted ' + result[this.options.uniqueProperty]);
        return result;
    }

    async initialize() {
        let schema = await this.httpService.fetch('GET', this.options.apiEntrypoint + '/' + this.typeKebabCase + '/schema');
        this.extractSimplifiedSchemas(schema);
        this.logger.debug('successfully loaded schema of ' + this.type + '!');
        let result = await this.httpService.fetch('GET', this.options.apiEntrypoint + '/' + this.typeKebabCase);
        if (Array.isArray(result.objects) && result.total === result.objects.length) {
            this.validate('array-' + this.type, result.objects);
            this.objects = result.objects;
            this.logger.debug('successfully loaded ' + this.objects.length + ' ' + this.type);
            this.subscriptions.push(this.eventAggregator.subscribe('notification-model', notification => {
                if (notification.contentType.toLowerCase() === this.type) {
                    if (notification.content) {
                        let functionName = this._.toLower(notification.operationType) + 'Object';
                        if (functionName === 'createObject') {
                            let objectToCreate = this.getObjectById(notification.content[this.options.uniqueProperty]);
                            if (!objectToCreate) {
                                this.objects.push(notification.content);
                            }
                        } else if (functionName === 'updateObject') {
                            let objectToUpdate = this.getObjectById(notification.content[this.options.uniqueProperty]);
                            if (objectToUpdate) {
                                Object.assign(objectToUpdate, notification.content);
                            }
                        } else if (functionName === 'deleteObject') {
                            let objectToDelete = this.getObjectById(notification.content[this.options.uniqueProperty]);
                            if (objectToDelete && Array.isArray(this.objects)) {
                                let index = this.objects.indexOf(objectToDelete);
                                if (index > -1) {
                                    this.objects.splice(index, 1);
                                }
                            }
                        }
                    }
                }
            }));
            this.isInitialized = true;
        } else {
            throw new Error('Could not initialize model-service since fetched data is not valid. Expected Array of ' + this.type + ' and received ' + result);
        }
    }

    async close() {
        this.disposeSubscriptions();
    }

}

export {ModelServiceBasicSchema};
