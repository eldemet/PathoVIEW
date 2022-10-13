import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {devices} from '../data';

class SamplingView extends BasicView {

    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

}

export {SamplingView};
