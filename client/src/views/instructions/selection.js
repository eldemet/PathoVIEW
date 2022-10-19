import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {getIconByType} from './instructions';
import {devices} from './data';

class SelectionView extends BasicView {

    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

    getIconByType(type) {
        return getIconByType(type);
    }

}

export {SelectionView};
