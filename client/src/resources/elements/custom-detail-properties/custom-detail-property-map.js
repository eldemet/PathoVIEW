import {v1 as uuid} from 'uuid';
import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';
import Leaflet from 'leaflet';

class CustomDetailPropertyMap extends BasicComposable {

    constructor(...rest) {
        super(...rest);
        this.uniqueId = uuid();
    }

    activate(model) {
        super.activate(model);
        if (this.value) {
            this.layers = {
                overlay: [
                    {
                        id: this.propertyKey,
                        type: 'geoJSON',
                        data: this.value
                    }
                ]
            };
            this.drawEnabled = false;
            try {
                this.center = Leaflet.geoJson(this.value).getBounds().getCenter();
            } catch (e) {
                //silently catch error
            }
        }
    }

}

export {CustomDetailPropertyMap};
