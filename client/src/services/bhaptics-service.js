import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object'; // eslint-disable-line no-unused-vars
import tactFiles from '../assets/tact-files';

@inject(EventAggregator)
class BhapticsService extends BasicService {

    status = 'disabled';

    /**
     * @abstract
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
        this.subscriptions.push(this.eventAggregator.subscribe('context-aware-alert', async payload => {
            if (this.status === 'connected') {
                if (payload.type === 'warning') {
                    await this.submitRegistered({
                        name: 'alert1', intensity: 0.5, duration: 1.0, fallback: 'none', offsetAngleX: 0, offsetY: 0
                    });
                } else if (payload.type === 'danger') {
                    let i = 0;
                    let interval = setInterval(async() => {
                        await this.submitRegistered({
                            name: 'alert2', intensity: 1.0, duration: 1.0, fallback: 'none', offsetAngleX: 0, offsetY: 0
                        });
                        i++;
                        if (i >= 5) {
                            clearInterval(interval);
                        }
                    }, 1000);
                } else {
                    // not implemented
                }
            }
        }));
    }

    async close() {
        this.disposeSubscriptions();
        this.status = 'disabled';
        this.logger.info('bhaptics closed');
    }

    /**
     * @abstract
     * @return {Promise<void>}
     */
    async pingAll() {
        this._notOverridden('async pingAll()');
    }

    /**
     * @abstract
     * @param {BhapticsTactFile} tactFile
     * @return {Promise<void>}
     */
    async register(tactFile) {
        this._notOverridden('async register(tactFile)');
    }

    /**
     * @abstract
     * @param {BhapticsCallRegistered} callRegistered
     * @return {Promise<void>}
     */
    async submitRegistered(callRegistered) {
        this._notOverridden('async submitRegistered(callRegistered)');
    }

}

export {BhapticsService};
