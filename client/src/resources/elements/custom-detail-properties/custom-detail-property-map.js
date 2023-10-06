import {v1 as uuid} from 'uuid';
import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';
import {locationUtilities, alertUtilities} from '../../../utilities';

class CustomDetailPropertyMap extends BasicComposable {

    value;
    object;
    propertyKey;
    schema;
    layer;

    /**
     * @param {ConstructorParameters<typeof BasicComposable>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.uniqueId = uuid();
    }

    activate(model) {
        super.activate(model);
        let popupContent;
        let utilities;
        try {
            if (this.object.type === 'Alert') {
                utilities = alertUtilities;
            }
        } catch (error) {
            // silently handle error
        }
        try {
            popupContent = locationUtilities.getMapLinkContent(this.value);
        } catch (error) {
            // object does not proper location with coordinates
        }
        if (this.value) {
            try {
                this.center = locationUtilities.getCenter(this.value);
            } catch (e) {
                //silently catch error
            }
            this.layers = {
                overlay: [
                    {
                        id: this.propertyKey,
                        type: 'geoJSON',
                        data: this.value,
                        settings: {
                            fitBounds: true
                        },
                        options: utilities?.getOptions?.(),
                        popupContent: popupContent
                    }
                ]
            };
        }
    }

}

export {CustomDetailPropertyMap};
