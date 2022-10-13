import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {devices} from '../data';

class TechnologyView extends BasicView {

    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

}

export {TechnologyView};
