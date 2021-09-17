import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';

export class StylesView extends BasicViewExtended {

    constructor(...rest) {
        super(...rest);
    }

    activate() {
        this.layers = {
            overlay: [
                {
                    id: 'iat',
                    type: 'marker',
                    latLng: [48.74151639537436, 9.096060098145793],
                    popupContent: 'Institut für Arbeitswissenschaft und Technologiemanagement'
                }
            ]
        };
    }

}
