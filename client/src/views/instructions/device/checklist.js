import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {devices} from '../data';

class ChecklistView extends BasicView {

    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

}

export {ChecklistView};
