import {v1 as uuid} from 'uuid';
import {BasicComposableAuFormItem} from 'library-aurelia/src/prototypes/basic-composable-au-form-item';
import {locationUtilities} from '../../../utilities';

export class CustomFormItemMap extends BasicComposableAuFormItem {

    drawEnabled = true;
    layerEvents = ['pm:edit', 'pm:update', 'pm:remove', 'pm:rotate'];

    /**
     * @param {ConstructorParameters<typeof BasicComposableAuFormItem>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.uniqueId = uuid();
        this.contextService = this.proxy.get('context');
    }

    async activate(model) {
        super.activate(model);
        this.searchControl = {
            provider: 'OpenStreetMapProvider',
            providerOptions: {params: {addressdetails: 1}},
            style: 'bar',
            searchLabel: this.i18n.tr('buttons.search')
        };
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
            if (event.type === 'pm:create' || event.type === 'geosearch:add') {
                this.object[this.propertyKey] = event.geoJson.geometry;
                this.drawEnabled = false;
                event.map.pm.Draw.disable();
                if (event.type === 'geosearch:add' && event.location?.raw?.address) {
                    let address = event.location.raw.address;
                    let locality = '';
                    if (address.city) locality += address.city;
                    if (address.village) locality += ', ' + address.village;
                    if (address.suburb) locality += ', ' + address.suburb;
                    if (address.county) locality += ', ' + address.county;
                    if (address.state) locality += ', ' + address.state;
                    let objectData = {
                        addressCountry: address.country,
                        addressLocality: locality,
                        postalCode: address.postcode,
                        streetAddress: address.road,
                        streetNr: address.house_number
                    };
                    this.eventAggregator.publish('au-form-item-object-change', {propertyKey: 'address', objectData});
                }
            } else if (event.type === 'pm:remove' || event.type === 'geosearch:remove') {
                this.object[this.propertyKey] = undefined;
                this.drawEnabled = true;
                if (event.type === 'geosearch:remove') {
                    this.eventAggregator.publish('au-form-item-object-change', {propertyKey: 'address'});
                }
            } else {
                this.object[this.propertyKey] = event.geoJson.geometry;
            }
            if (this.form.validateTrigger === 'change') {
                this.validationController.validate();
                this.form.dispatchEvent(new Event('input'));
            }
        }));
    }

}
