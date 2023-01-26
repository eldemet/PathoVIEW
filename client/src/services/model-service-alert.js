import {AureliaCookie} from 'aurelia-cookie';
import {ModelServiceAsyncUISchema} from './model-service-async-ui-schema';

/**
 * @extends ModelServiceAsyncUISchema
 * @category services
 */
class ModelServiceAlert extends ModelServiceAsyncUISchema {

    scenario;
    objects;

    async getObjects() {
        const scenario = AureliaCookie.get('scenario');
        let result;
        if (scenario) {
            if (!this.objects || this.scenario !== scenario) {
                result = await this.httpService.fetch('GET', '/api/v1/pathoware/model/' + scenario + '/alert');
                this.logger.debug(`successfully loaded ${result.total} alerts`);
                this.objects = result.objects;
            } else {
                result = {total: this.objects.length, queryTotal: this.objects.length, collectionTotal: this.objects.total, objects: this.objects};
            }
        } else {
            result = {total: 0, queryTotal: 0, collectionTotal: 0, objects: []};
        }
        return result;
    }

    async getObject(id) {
        await this.checkInitialized();
        return this.getObjectById(id);
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

    async checkInitialized() {
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

}

export {ModelServiceAlert};
