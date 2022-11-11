import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {instructionsUtilities} from '../../utilities';
import {devices} from './data';

class SelectionView extends BasicView {

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.devices = devices;
    }

    getIconByType(type) {
        return instructionsUtilities.getIconByType(type);
    }

}

export {SelectionView};
