import {BasicComposableExtended} from 'library-aurelia/src/prototypes/basic-composable-extended';
import Leaflet from 'leaflet';

class CustomDetailPropertyMap extends BasicComposableExtended {

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
