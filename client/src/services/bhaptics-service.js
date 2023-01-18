import {inject} from "aurelia-framework";
import {EventAggregator} from "aurelia-event-aggregator";
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object';
import tactFiles from "../assets/tact-files";

@inject(EventAggregator)
class BhapticsService extends BasicService {

    status = 'disabled';

    /**
     * @param {EventAggregator} eventAggregator
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(eventAggregator, ...rest) {
        super('bhaptics', ...rest);
        this.eventAggregator = eventAggregator;
    }

    async initialize() {
        for (let tactFile of tactFiles) {
            try {
                await this.register(tactFile);
            } catch (error) {
                //handle silently
            }
        }
        this.subscriptions.push(this.eventAggregator.subscribe('haptics-event', async payload => {
            let callRegistered = {name: 'heartbeat', fallback: 'none', offsetAngleX: 0, offsetY: 0}
            if (payload.type === 'warning') {
                callRegistered.intensity = 0.5;
                callRegistered.duration = 1.0;
                await this.submitRegistered(callRegistered);
            } else if (payload.type === 'danger') {
                callRegistered.intensity = 1.0;
                callRegistered.duration = 1.0;
                let i = 0;
                let interval = setInterval(async () => {
                    await this.submitRegistered(callRegistered);
                    i++;
                    if (i > 5) {
                        clearInterval(interval);
                    }
                }, 1000);
            } else {
                // not implemented
            }
        }));
    }

    async close() {
        this.disposeSubscriptions();
        this.status = 'disabled';
        this.logger.info('bhaptics closed');
    }

    async register(tactFile) {
        this.logger.warn('register: not implemented');
    }

    async submitRegistered(callRegistered) {
        this.logger.warn('submitRegistered: not implemented')
    }

}

export {BhapticsService};
