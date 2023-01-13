import {inject} from "aurelia-framework";
import {EventAggregator} from "aurelia-event-aggregator";
import {BasicService} from 'library-aurelia/src/prototypes/basic-service';
import {BasicObject} from 'library-aurelia/src/prototypes/basic-object';

@inject(EventAggregator)
class BhapticsService extends BasicService {

    /**
     * @param {EventAggregator} eventAggregator
     * @param {ConstructorParameters<typeof BasicObject>} rest
     */
    constructor(eventAggregator, ...rest) {
        super('bhaptics', ...rest);
        this.eventAggregator = eventAggregator;
    }

    async initialize() {
        this.subscriptions.push(this.eventAggregator.subscribe('haptics-event', payload => {
            this.submitRegistered();
        }));
    }

    async close() {
        this.disposeSubscriptions();
    }

    async submitRegistered(tact) {
        this.logger.warn('submitRegistered: not implemented')
    }

}

export {BhapticsService};
