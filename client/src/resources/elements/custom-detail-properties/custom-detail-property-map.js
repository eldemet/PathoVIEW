import {v1 as uuid} from 'uuid';
import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';
import {locationUtilities} from '../../../utilities';

class CustomDetailPropertyMap extends BasicComposable {

    value;
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
                        }
                    }
                ]
            };
        }
    }

}

export {CustomDetailPropertyMap};
