import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {instructionsUtilities} from '../../utilities';
import {devices} from './data';

class InstructionDetailView extends BasicView {

    currentStep = 0;

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
        return instructionsUtilities.getIconByType(type);
    }

    setAllIconsChecked(item) {
        let checked = true;
        if (Array.isArray(item.checklistItems)) {
            checked = item.checklistItems.filter(i => !!i.checked).length === item.checklistItems.length;
        }
        item.allItemsChecked = checked;
    }

}

export {InstructionDetailView};
