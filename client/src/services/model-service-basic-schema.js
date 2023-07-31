import {ModelService} from 'library-aurelia/src/services/model-service';

/**
 * @extends ModelService
 * @category services
 */
class ModelServiceBasicSchema extends ModelService {

    /**
     * @param {String} type
     * @param {Object} options
     * @param {String} options.apiEntrypoint
     * @param {Object} [options.endpoints]
     * @param {String} [options.endpoints.getSchema]
     * @param {String} [options.endpoints.getObjects]
     * @param {String} [options.endpoints.getObject]
     * @param {String} [options.endpoints.createObject]
     * @param {String} [options.endpoints.updateObject]
     * @param {String} [options.endpoints.deleteObject]
     * @param {import('library-aurelia/src/services/http-service').HttpService} httpService
     * @param {ConstructorParameters<typeof import('library-aurelia/src/prototypes/basic-object').BasicObject>} rest
     */
    constructor(type, options, httpService, ...rest) {
        super(type, options, ...rest);
        this.httpService = httpService;
        this.setEndpoints(options.apiEntrypoint, type, options.endpoints);
    }

    setEndpoints(apiEntrypoint, type, endpoints = {}) {
        let typeKebabCase = this._.kebabCase(type);
        let createUrl = (override, defaultPath) => {
            return override ? override : apiEntrypoint + '/' + defaultPath;
        };
        this.options.endpoints = {
            getSchema: createUrl(endpoints.getSchema, `${typeKebabCase}/schema`),
            getObjects: createUrl(endpoints.getObjects, `${typeKebabCase}`),
            getObject: createUrl(endpoints.getObject, `${typeKebabCase}/:id`),
            createObject: createUrl(endpoints.createObject, `${typeKebabCase}`),
            updateObject: createUrl(endpoints.updateObject, `${typeKebabCase}/:id`),
            deleteObject: createUrl(endpoints.deleteObject, `${typeKebabCase}/:id`)
        };
    }

    async createObject(object) {
        await this.checkInitialized();
        let createdObject = await this.httpService.fetch('POST', this.options.endpoints.createObject, object);
        let id = createdObject[this.options.uniqueProperty];
        if (this.getObjectById(id) === null) {
            if (Array.isArray(this.objects)) {
                this.objects.push(createdObject);
            }
        }
        this.logger.debug(`successfully created ${this.type} ${id}`);
        return createdObject;
    }

    async updateObject(object) {
        await this.checkInitialized();
        let id = object[this.options.uniqueProperty];
        let updatedObject = await this.httpService.fetch('PUT', this.options.endpoints.updateObject.replace(':id', id), object);
        let objectToUpdate = this.getObjectById(id);
        if (objectToUpdate) {
            Object.assign(objectToUpdate, updatedObject);
        }
        this.logger.debug(`successfully updated ${this.type} ${id}`);
        return updatedObject;
    }

    async deleteObject(object) {
        await this.checkInitialized();
        let id = object[this.options.uniqueProperty];
        let deletedObject = await this.httpService.fetch('DELETE', this.options.endpoints.deleteObject.replace(':id', id), object);
        let objectToDelete = this.getObjectById(id);
        let index = this.objects.indexOf(objectToDelete);
        if (index > -1) {
            this.objects.splice(index, 1);
        }
        this.logger.debug(`successfully deleted ${this.type} ${id}`);
        return deletedObject;
    }

    async loadSchema() {
        let schema = await this.httpService.fetch('GET', this.options.endpoints.getSchema);
        this.extractSimplifiedSchemas(schema);
        this.logger.debug(`successfully loaded schema of ${this.type}`);
    }

    async loadObjects() {
        let result = await this.httpService.fetch('GET', this.options.endpoints.getObjects);
        this.validate('array-' + this.type, result.objects);
        this.objects = result.objects;
        this.logger.debug(`successfully loaded ${this.type}s (${this.objects.length})`);
    }

    async initialize() {
        try {
            await this.loadSchema();
            await this.loadObjects();
            this.subscriptions.push(this.eventAggregator.subscribe('notification-model', notification => {
                if (notification.contentType.toLowerCase() === this.type) {
                    if (notification.content) {
                        let object = notification.content;
                        let functionName = notification.operationType.toLowerCase() + 'Object';
                        if (functionName === 'createObject') {
                            let objectToCreate = this.getObjectById(object[this.options.uniqueProperty]);
                            if (!objectToCreate) {
                                this.objects.push(object);
                            }
                        } else if (functionName === 'updateObject') {
                            let objectToUpdate = this.getObjectById(object[this.options.uniqueProperty]);
                            if (objectToUpdate) {
                                Object.assign(objectToUpdate, object);
                            }
                        } else if (functionName === 'deleteObject') {
                            let objectToDelete = this.getObjectById(object[this.options.uniqueProperty]);
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
            this.initializeResolve();
        } catch (error) {
            this.initializeReject(new Error(`Initialization of model service ${this.type} failed. ${error.message} `));
        }
    }

    async close() {
        this.disposeSubscriptions();
        this.initializePromise = null;
        this.initializeResolve = null;
        this.initializeReject = null;
    }

    async checkInitialized() {
        if (!this.initializePromise) {
            this.initializePromise = new Promise((resolve, reject) => {
                this.initializeResolve = resolve;
                this.initializeReject = reject;
            });
            await this.initialize();
        } else {
            await this.initializePromise;
        }
    }

}

export {ModelServiceBasicSchema};
