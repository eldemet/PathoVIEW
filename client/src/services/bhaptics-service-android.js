import {registerPlugin} from "@capacitor/core";
import {BhapticsService} from "./bhaptics-service";

class BhapticsServiceImplementation extends BhapticsService {

    async initialize(config) {
        await super.initialize();
        /** @returns BhapticsServicePlugin */
        this.bhapticsServicePlugin = registerPlugin('BhapticsService');
        this.androidSubscription = this.bhapticsServicePlugin.addListener('device-list-update-event', payload => {
            this.logger.info('device list update received', payload);
            this.devices = payload.devices;
        });
        this.devices = (await this.bhapticsServicePlugin.getDeviceList()).devices;
    }

    async close() {
        await super.close();
        this.androidSubscription.remove();
        await this.bhapticsServicePlugin.close();
    }

    async pingAll() {
        return await this.bhapticsServicePlugin.pingAll();
    }

    async submitRegistered() {
        await this.bhapticsServicePlugin.submitRegistered();
    }

}

export {BhapticsServiceImplementation};
