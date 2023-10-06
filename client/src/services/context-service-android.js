import BackgroundGeolocation from '@transistorsoft/capacitor-background-geolocation';
import {App} from '@capacitor/app';
import {Device} from '@capacitor/device';
import {ContextService} from './context-service';

class ContextServiceImplementation extends ContextService {

    events = [];
    isMoving = false;
    activity = 'still';

    async enableContextAwareAlerts() {
        await super.enableContextAwareAlerts();
        this.subscriptions.push(BackgroundGeolocation.onLocation(async(location) => {
            try {
                this.currentLocation = {type: 'Point', coordinates: [location.coords.longitude, location.coords.latitude]};
                const info = await Device.getInfo(); // eslint-disable-line no-unused-vars
                const batteryInfo = await Device.getBatteryInfo(); // eslint-disable-line no-unused-vars
                await this.updateDevice();
                this.checkForAlertsNearCurrentLocation();
            } catch (error) {
                this.logger.warn(error.message);
            }
        }));
        this.subscriptions.push(BackgroundGeolocation.onMotionChange((event) => {
            this.isMoving = event.isMoving;
        }));
        this.subscriptions.push(BackgroundGeolocation.onActivityChange((event) => {
            this.activity = event.activity;
        }));
        this.subscriptions.push(BackgroundGeolocation.onProviderChange((event) => {
            //TODO
        }));
        await BackgroundGeolocation.ready({
            desiredAccuracy: BackgroundGeolocation.DESIRED_ACCURACY_HIGH,
            distanceFilter: 10,
            stopTimeout: 5,
            debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
            logLevel: BackgroundGeolocation.LOG_LEVEL_VERBOSE,
            stopOnTerminate: false,
            startOnBoot: false
        });
        this.state = await BackgroundGeolocation.start();
        // @ts-ignore
        this.logger.info(this.state);
        App.addListener('resume', data => {
            this.updateContentAfterPageFreeze();
        });
    }

    async disableContextAwareAlerts() {
        await super.disableContextAwareAlerts();
        await super.close();
        this.state = await BackgroundGeolocation.stop();
        await App.removeAllListeners();
        // @ts-ignore
        this.logger.info(this.state);
    }

}

export {ContextServiceImplementation};
