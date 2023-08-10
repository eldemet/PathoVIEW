import {inject} from 'aurelia-framework';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {catchError, loadingEvent} from 'library-aurelia/src/decorators';
import {instructionsUtilities} from '../../utilities';

@inject(HttpService)
class InstructionDetailView extends BasicView {

    currentStep = 0;

    /**
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(httpService, ...rest) {
        super(...rest);
        this.httpService = httpService;
    }

    @loadingEvent('instruction-alert', 'device')
    @catchError('instruction-alert')
    async activate(params, routeConfig, navigationInstruction) {
        super.activate(params, routeConfig, navigationInstruction);
        this.device = await this.httpService.fetch('GET', `${location.origin}/assets/instructions/${this.i18n.getLocale()}/${params.device}.json`);
        this.instruction = this.device.instructions[params.index];
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
