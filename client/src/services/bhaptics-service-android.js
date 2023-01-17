import {registerPlugin} from "@capacitor/core";
import {BhapticsService} from "./bhaptics-service";

class BhapticsServiceImplementation extends BhapticsService {

    async initialize(config) {
        /** @returns BhapticsServicePlugin */
        this.bhapticsServicePlugin = registerPlugin('BhapticsService');
        await super.initialize();
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

    async register(tactFile) {
        await this.bhapticsServicePlugin.register(tactFile);
    }

    async submitRegistered(callRegistered) {
        await this.bhapticsServicePlugin.submitRegistered(callRegistered);
    }

}

export {BhapticsServiceImplementation};
