import {v1 as uuid} from 'uuid';
import {inject} from 'aurelia-framework';
import {BasicComposableAuFormItem} from 'library-aurelia/src/prototypes/basic-composable-au-form-item';
import {locationUtilities} from '../../../utilities';
import {ContextService} from '../../../services/context-service';

@inject(ContextService)
export class CustomFormItemMap extends BasicComposableAuFormItem {

    drawEnabled = true;
    layerEvents = ['pm:edit', 'pm:update', 'pm:remove', 'pm:rotate'];

    /**
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicComposableAuFormItem>} rest
     */
    constructor(contextService, ...rest) {
        super(...rest);
        this.uniqueId = uuid();
        this.contextService = contextService;
    }

    async activate(model) {
        super.activate(model);
        if (this.object[this.propertyKey]) {
            this.layers = {
                overlay: [
                    {
                        id: this.propertyKey,
                        type: 'geoJSON',
                        data: this.object[this.propertyKey],
                        events: this.layerEvents,
                        settings: {
                            fitBounds: true
                        }
                    }
                ]
            };
            this.drawEnabled = false;
            try {
                this.center = locationUtilities.getCenter(this.object[this.propertyKey]);
            } catch (e) {
                //silently catch error
            }
        }
        try {
            await this.contextService.initialized;
            this.defaultCenter = locationUtilities.getCenter(this.contextService.currentEmergencyEvent.location);
        } catch (error) {
            //silently catch error
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
            this.validationController.validate();
        }));
    }

}
