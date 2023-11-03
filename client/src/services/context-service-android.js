import {observable} from 'aurelia-framework';
import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import {App} from '@capacitor/app';
import {Device} from '@capacitor/device';
import {ContextService} from './context-service';

class ContextServiceImplementation extends ContextService {

    isMoving = false;
    /** @type {import('@transistorsoft/capacitor-background-geolocation').MotionActivityType} */
    activity = 'still';
    /** @type {import('@transistorsoft/capacitor-background-geolocation').ProviderChangeEvent} */
    provider;

    @observable backgroundGeolocationDebug = localStorage.getItem('background-geolocation-debug') === 'true';
    @observable backgroundGeolocationDistanceFilter = localStorage.getItem('background-geolocation-distance-filter') || '5';

    async enableContextAwareAlerts() {
        await super.enableContextAwareAlerts();
        BackgroundGeolocation.onLocation(async(location) => {
            await this.update(location);
        });
        BackgroundGeolocation.onMotionChange((event) => {
            this.isMoving = event.isMoving;
        });
        BackgroundGeolocation.onActivityChange((event) => {
            this.activity = event.activity;
        });
        BackgroundGeolocation.onProviderChange((event) => {
            this.provider = event;
        });
        this.state = await BackgroundGeolocation.ready({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: parseInt(this.backgroundGeolocationDistanceFilter, 10),
            stopTimeout: 10,
            debug: this.backgroundGeolocationDebug, // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
            stopOnTerminate: false,
            startOnBoot: false
        });
        if (!this.state.enabled) this.state = await BackgroundGeolocation.start();
        let location = await BackgroundGeolocation.getCurrentPosition({samples: 1, persist: true});
        await this.update(location);
        // @ts-ignore
        this.logger.info(this.state);
        await App.addListener('resume', data => {
            this.updateContentAfterPageFreeze();
        });
    }

    async disableContextAwareAlerts() {
        await super.disableContextAwareAlerts();
        await super.close();
        this.state = await BackgroundGeolocation.stop();
        await App.removeAllListeners();
        await BackgroundGeolocation.removeListeners();
    }

    async backgroundGeolocationDebugChanged(debug) {
        await BackgroundGeolocation.setConfig({debug});
        localStorage.setItem('background-geolocation-debug', debug);
    }

    async backgroundGeolocationDistanceFilterChanged(distanceFilter) {
        await BackgroundGeolocation.setConfig({distanceFilter});
        localStorage.setItem('background-geolocation-distance-filter', distanceFilter);
    }

    /**
     * @param {import('@transistorsoft/capacitor-background-geolocation').Location} location
     * @return {Promise<void>}
     */
    async update(location) {
        let taskId;
        try {
            taskId = await BackgroundGeolocation.startBackgroundTask();
            this.currentLocation = {type: 'Point', coordinates: [location.coords.longitude, location.coords.latitude]};
            await this.updateDevice();
            this.checkForAlertsNearCurrentLocation();
        } catch (error) {
            this.handleError(error);
        } finally {
            await BackgroundGeolocation.stopBackgroundTask(taskId);
        }
    }

    async getNewDeviceValues() {
        const deviceInfo = await Device.getInfo();
        const batteryInfo = await Device.getBatteryInfo();
        return {
            name: this.proxy.get('auth')?.userInfo?.name || 'undefined',
            batteryLevel: batteryInfo.batteryLevel,
            osVersion: deviceInfo.platform + ' ' + deviceInfo.osVersion,
            softwareVersion: deviceInfo.operatingSystem + ' ' + (deviceInfo.androidSDKVersion || deviceInfo.iOSVersion),
            provider: deviceInfo.manufacturer + ' ' + deviceInfo.model + ' ' + deviceInfo.name,
            location: this.currentLocation
            // firmwareVersion, hardwareVersion, ipAddress, macAddress, rssi
        };
    }

}

export {ContextServiceImplementation};
