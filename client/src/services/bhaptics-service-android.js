import {registerPlugin} from "@capacitor/core";
import {BhapticsService} from "./bhaptics-service";

class BhapticsServiceImplementation extends BhapticsService {

    /**
     * @param {ConstructorParameters<typeof BhapticsService>} rest
     */
    constructor(...rest) {
        super(...rest);
        /** @returns BhapticsServicePlugin */
        this.bhapticsServicePlugin = registerPlugin('BhapticsService');
    }

    async initialize(config) {
        this.status = 'connecting';
        try {
            await this.bhapticsServicePlugin.initialize();
            this.androidSubscription = this.bhapticsServicePlugin.addListener('device-list-update-event', payload => {
                this.logger.info('device list update received', payload);
                this.devices = payload.devices;
            });
            this.devices = (await this.bhapticsServicePlugin.getDeviceList()).devices;
            this.logger.info('bhaptics connected!');
            this.status = 'connected';
        } catch (error) {
            this.status = 'error';
        }
        await super.initialize();
    }

    async close() {
        this.androidSubscription.remove();
        await this.bhapticsServicePlugin.close();
        this.devices = null;
        this.status = 'disabled';
        await super.close();
    }

    async pingAll() {
        return await this.bhapticsServicePlugin.pingAll();
    }

    async register(tactFile) {
        await this.bhapticsServicePlugin.register(tactFile);
    }

    async submitRegistered(callRegistered) {
        await this.bhapticsServicePlugin.submitRegistered(callRegistered);
    }

}

export {BhapticsServiceImplementation};
