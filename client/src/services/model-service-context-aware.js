import {stringify} from 'query-string';
import {ModelServiceBasic} from 'library-aurelia/src/services/model-service-basic';
import {loadingEvent} from 'library-aurelia/src//decorators';
import {AureliaCookie} from 'aurelia-cookie';

/**
 * @extends ModelServiceBasic
 * @category services
 */
class ModelServiceContextAware extends ModelServiceBasic {

    /**
     * @param {String} type
     * @param {ModelServiceOptionsContextAware} options
     * @param {import('library-aurelia/src/services/http-service').HttpService} httpService
     * @param {ConstructorParameters<typeof import('library-aurelia/src/prototypes/basic-object').BasicObject>} rest
     */
    constructor(type, options, httpService, ...rest) {
        super(type, options, httpService, ...rest);
        this.options = options;
    }

    setEndpoints(apiEntrypoint, type, endpoints = {}) {
        let typeKebabCase = this._.kebabCase(type);
        let createUrl = (override, defaultPath) => {
            let url = override ? override : defaultPath;
            url = url.replace(':api-entrypoint', apiEntrypoint).replace(':type', typeKebabCase);
            let emergencyEventId = AureliaCookie.get('emergency-event');
            let scenario = AureliaCookie.get('scenario') || 'limassol';
            if (emergencyEventId) {
                url = url
                    .replace(':scenario', scenario)
                    .replace(':emergency-event', emergencyEventId)
                    .replace(':filter-query', '?' + stringify({filter: JSON.stringify({[this.options.filterProperty]: emergencyEventId})}));
            }
            return url;
        };
        this.endpoints = {
            getSchema: createUrl(endpoints.getSchema, ':api-entrypoint/:type/schema'),
            getObjects: createUrl(endpoints.getObjects, ':api-entrypoint/:type'),
            getObject: createUrl(endpoints.getObject, ':api-entrypoint/:type/:id'),
            createObject: createUrl(endpoints.createObject, ':api-entrypoint/:type'),
            updateObject: createUrl(endpoints.updateObject, ':api-entrypoint/:type/:id'),
            deleteObject: createUrl(endpoints.deleteObject, ':api-entrypoint/:type/:id')
        };
    }

    @loadingEvent('app-alert')
    async loadObjects() {
        let objects = [];
        this.emergencyEventId = AureliaCookie.get('emergency-event');
        if (this.emergencyEventId) {
            try {
                this.setEndpoints(this.options.apiEntrypoint, this.type, this.options.endpoints);
                let result = await this.httpService.fetch('GET', this.endpoints.getObjects);
                objects = result.objects || result;
                this.logger.debug(`successfully loaded ${this.type}s (${objects.length})`);
            } catch (error) {
                this.logger.error(error.message);
            }
        }
        this.objects = objects;
    }

    async getObjects(query, searchProperties, forceReload) {
        await this.initialized();
        if (forceReload || this.emergencyEventId !== AureliaCookie.get('emergency-event')) {
            await this.loadObjects();
        }
        return await super.getObjects(query, searchProperties);
    }

}

export {ModelServiceContextAware};
