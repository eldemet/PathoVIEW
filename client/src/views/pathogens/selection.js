import {BasicView} from 'library-aurelia/src/prototypes/basic-view';

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
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    async attached() {
        this.pathogens = (await this.proxy.get('pathogen').getObjects({localize: true})).objects;
    }

}

export {SelectionView};
