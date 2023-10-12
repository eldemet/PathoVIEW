import {observable} from 'aurelia-framework';
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import tactFiles from '../assets/tact-files';

class BhapticsService extends BasicService {

    @observable bhapticsServiceEnabled = localStorage.getItem('bhaptics-service-enabled') !== 'false';

    status = 'disabled';

    /**
     * @abstract
     * @param {ConstructorParameters<typeof import('library-aurelia/src/prototypes/basic-object').BasicObject>} rest
     */
    constructor(...rest) {
        super('bhaptics', ...rest);
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

    async bhapticsServiceEnabledChanged(enabled) {
        localStorage.setItem('bhaptics-service-enabled', enabled);
        if (enabled) {
            await this.initialize();
        } else {
            await this.close();
        }
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
     * @param {import('../types').BhapticsTactFile} tactFile
     * @return {Promise<void>}
     */
    async register(tactFile) {
        this._notOverridden('async register(tactFile)');
    }

    /**
     * @abstract
     * @param {import('../types').BhapticsCallRegistered} callRegistered
     * @return {Promise<void>}
     */
    async submitRegistered(callRegistered) {
        this._notOverridden('async submitRegistered(callRegistered)');
    }

}

export {BhapticsService};
