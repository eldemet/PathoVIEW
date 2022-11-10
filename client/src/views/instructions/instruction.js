import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {getIconByType} from './instructions';
import {devices} from './data';

class ChecklistView extends BasicView {

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    async activate(params, routeConfig, navigationInstruction) {
        super.activate(params, routeConfig, navigationInstruction);
        this.devices = devices;
        this.instruction = this.devices[params.device].instructions[params.index];
        routeConfig.navModel.setTitle(this.instruction.name);
    }

    getIconByType(type) {
        return getIconByType(type);
    }

}

export {ChecklistView};
