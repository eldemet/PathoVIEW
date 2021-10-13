import Leaflet from 'leaflet';
import {BasicComposableExtended} from 'library-aurelia/src/prototypes/basic-composable-extended';

export class CustomFormItemMap extends BasicComposableExtended {

    drawEnabled = true;
    layerEvents = ['pm:edit', 'pm:update', 'pm:remove', 'pm:rotate'];

    constructor(...rest) {
        super(...rest);
    }

    activate(model) {
        super.activate(model);
        if (this.object[this.propertyKey]) {
            this.layers = {
                overlay: [
                    {
                        id: this.propertyKey,
                        type: 'geoJSON',
                        data: this.object[this.propertyKey],
                        events: this.layerEvents
                    }
                ]
            };
            this.drawEnabled = false;
            try {
                this.center = Leaflet.geoJson(this.object[this.propertyKey]).getBounds().getCenter();
            } catch (e) {
                //silently catch error
            }
        }
    }

    attached() {
        super.attached();
        this.subscriptions.push(this.eventAggregator.subscribe('aurelia-leaflet', event => {
            this.logger.debug('aurelia-leaflet', event);
            if (event.type === 'pm:create') {
                this.object[this.propertyKey] = event.geoJson.geometry;
                this.drawEnabled = false;
                event.map.pm.Draw.disable();
            } else if (event.type === 'pm:remove') {
                this.object[this.propertyKey] = undefined;
                this.drawEnabled = true;
            } else {
                this.object[this.propertyKey] = event.geoJson.geometry;
            }
        }));
    }

}
