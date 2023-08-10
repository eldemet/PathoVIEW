import {inject} from 'aurelia-framework';
import {HttpService} from 'library-aurelia/src/services/http-service';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {catchError, loadingEvent} from 'library-aurelia/src/decorators';

@inject(HttpService)
class SelectionView extends BasicView {


    pathogenContents = [
        {propertyKey: 'transmission', icon: 'malaria_mixed_microscope.svg'},
        {propertyKey: 'symptoms', icon: 'stethoscope.svg'},
        {propertyKey: 'complications', icon: 'symptom.svg'},
        {propertyKey: 'diagnosis', icon: 'microscope.svg'},
        {propertyKey: 'treatment', icon: 'syringe.svg'},
        {propertyKey: 'prevention', icon: 'water_treatment.svg'},
        {propertyKey: 'controlMeasures', icon: 'rdt_result_mixed.svg'}
    ];

    /**
     * @param {HttpService} httpService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(httpService, ...rest) {
        super(...rest);
        this.httpService = httpService;
    }

    @loadingEvent('pathogen-alert', 'pathogen')
    @catchError('pathogen-alert')
    async attached() {
        const cryptosporidiosis = await this.httpService.fetch('GET', `${location.origin}/assets/pathogens/${this.i18n.getLocale()}/cryptosporidiosis.json`);
        const ecoli = await this.httpService.fetch('GET', `${location.origin}/assets/pathogens/${this.i18n.getLocale()}/ecoli.json`);
        this.pathogens = [cryptosporidiosis, ecoli];
    }

}

export {SelectionView};
