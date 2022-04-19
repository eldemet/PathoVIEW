import {inject} from 'aurelia-framework';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {HttpService} from 'library-aurelia/src/services/http-service';
import * as platform from 'platform';
import pick from 'lodash/pick';
import isEqual from 'lodash/isEqual';
import {AuthService} from './auth-service';
import {deviceUtilities} from '../utilities';

/**
 * @extends BasicService
 * @category services
 */
@inject(HttpService)
class ContextService extends BasicService {

    constructor(httpService) {
        super();
        this.httpService = httpService;
    }

    async update() {
        let batteryLevel;
        let location;
        try {
            batteryLevel = (await navigator.getBattery()).level;
        } catch (error) {
            // silently handle error
        }
        try {
            const pos = await new Promise((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
            location = {type: 'Point', coordinates: [pos.coords.longitude, pos.coords.latitude]};
        } catch (error) {
            // silently handle error
        }
        let old = pick(this.currentDevice, ['batteryLevel', 'osVersion', 'softwareVersion', 'supportedProtocol', 'provider', 'location']);
        let device = {
            batteryLevel: batteryLevel,
            osVersion: platform.os.toString(),
            softwareVersion: platform.name + ' ' + platform.version,
            supportedProtocol: ['http'],
            provider: platform.manufacturer || '',
            location: location
            // firmwareVersion: '',
            // hardwareVersion: '',
            // ipAddress: '',
            // macAddress: '',
            // rssi: '',
        };
        if (!isEqual(old, device)) {
            this.logger.info(device);
            try {
                this.currentDevice = await this.httpService.fetch('PUT', '/api/v1/model/device/' + this.currentDevice.id, device, 2000);
            } catch (error) {
                if (error.status === 406) {
                    this.currentDevice = device;
                } else {
                    this.logger.error(error.message);
                }
            }
        } else {
            this.logger.debug('Nothing to update for current device!');
        }
    }

    async initialize(timeout = 20000) {
        this.devices = (await this.httpService.fetch('GET', '/api/v1/model/device?filter=' + JSON.stringify({owner: AuthService.getUserId()}), null, 5000)).objects;
        this.currentDevice = this.getCurrentDevice();
        this.initialized = true;
        while (this.initialized) {
            await this.update();
            await new Promise((resolve) => setTimeout(resolve, timeout));
        }
    }

    async close() {
        this.initialized = false;
    }

    getCurrentDevice() {
        if (!Array.isArray(this.devices) || this.devices.length === 0) {
            throw new Error('No device for user found!');
        }
        let currentDevice = this.devices[0];
        for (let device of this.devices) {
            if (device.osVersion === platform.os.toString() || device.manufacturer === platform.manufacturer) {
                currentDevice = device;
                break;
            }
        }
        return currentDevice;
    }

    getDeviceIcon(device) {
        return deviceUtilities.getDeviceIcon(device);
    }

}

export {ContextService};
