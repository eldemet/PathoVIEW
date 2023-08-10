import {inject} from 'aurelia-framework';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {catchError, loadingEvent} from 'library-aurelia/src/decorators';
import {instructionsUtilities} from '../../utilities';

@inject(HttpService)
class SelectionView extends BasicView {

    /**
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(httpService, ...rest) {
        super(...rest);
        this.httpService = httpService;
        this.instructionsUtilities = instructionsUtilities;
    }

    @loadingEvent('instruction-alert', 'device')
    @catchError('instruction-alert')
    async attached() {
        await super.attached();
        const pathotestick = await this.httpService.fetch('GET', `${location.origin}/assets/instructions/${this.i18n.getLocale()}/pathotestick.json`);
        const bactcontrol = await this.httpService.fetch('GET', `${location.origin}/assets/instructions/${this.i18n.getLocale()}/bactcontrol.json`);
        const aquasense = await this.httpService.fetch('GET', `${location.origin}/assets/instructions/${this.i18n.getLocale()}/aquasense.json`);
        const iotgateway = await this.httpService.fetch('GET', `${location.origin}/assets/instructions/${this.i18n.getLocale()}/iotgateway.json`);
        this.devices = {pathotestick, bactcontrol, aquasense, iotgateway};
    }

}

export {SelectionView};
