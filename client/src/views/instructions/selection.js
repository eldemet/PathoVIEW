import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';
import {devices} from './data';

class SelectionView extends BasicViewExtended {

    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

}

export {SelectionView};
