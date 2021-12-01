import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';
import {devices} from '../data';

class ChecklistView extends BasicViewExtended {

    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

}

export {ChecklistView};
