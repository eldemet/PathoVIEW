import {BindingEngine, inject} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {alertUtilities, deviceUtilities} from '../../utilities';
import {ContextService} from '../../services/context-service';

@inject(BindingEngine, ContextService)
class MapView extends BasicView {

    constructor(bindingEngine, contextService, ...rest) {
        super(...rest);
        this.bindingEngine = bindingEngine;
        this.contextService = contextService;
    }

    async attached() {
        await this.contextService.initialized;
        this.subscriptions.push(this.bindingEngine.propertyObserver(this.contextService, 'alerts')
            .subscribe(async(newValue, oldValue) => {
                this.updateLayerGroup('alert', this.contextService.alerts, alertUtilities);
            }));
        this.subscriptions.push(this.bindingEngine.propertyObserver(this.contextService, 'devices')
            .subscribe(async(newValue, oldValue) => {
                this.updateLayerGroup('device', this.contextService.devices, deviceUtilities);
            }));
        let overlay = [];
        overlay.push(this.getLayerGroup('device', this.contextService.devices, deviceUtilities));
        overlay.push(this.getLayerGroup('alert', this.contextService.alerts, alertUtilities));
        this.layers = {overlay};
    }

    updateLayerGroup(type, objects, utilities) {
        if (objects) {
            let layers = Object.assign({}, this.layers);
            let oldAlertLayerGroup = layers.overlay.find(x => x.id === type);
            if (oldAlertLayerGroup) {
                layers.overlay.splice(layers.overlay.indexOf(oldAlertLayerGroup), 1);
            }
            layers.overlay.push(this.getLayerGroup(type, objects, utilities));
            this.layers = layers;
        }
    }

    getLayerGroup(type, objects, utilities) {
        return {
            id: type,
            type: 'layerGroup',
            layers: objects.map(object => {
                return {
                    id: object.id,
                    type: 'geoJSON',
                    data: object.location,
                    options: utilities.getOptions?.(),
                    popupContent: utilities.getPopupContent(this.i18n, object)
                };
            })
        };
    }

}

export {MapView};
