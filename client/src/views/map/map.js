import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {modelUtilities, alertUtilities, deviceUtilities, missionUtilities, locationUtilities} from '../../utilities';

class MapView extends BasicView {

    mapEvents = ['overlayremove', 'overlayadd'];
    hiddenOverlays = this.catchError(JSON.parse)(localStorage.getItem('leaflet-hidden-overlays')) || [];

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.contextService = this.proxy.get('context');
    }

    async attached() {
        super.attached();
        await this.contextService.initialized;
        this.users = (await this.proxy.get('auth').getUsers()).objects;
        this.userId = this.proxy.get('auth').getUserId();
        let overlay = [];
        if (this.contextService.alerts) {
            this.subscriptions.push(this.bindingEngine.propertyObserver(this.contextService, 'alerts')
                .subscribe(async(newValue, oldValue) => {
                    this.updateLayerGroup('alert', this.contextService.alerts, alertUtilities);
                }));
            overlay.push(this.getLayerGroup('alert', this.contextService.alerts, alertUtilities));
        }
        if (this.contextService.missions) {
            this.subscriptions.push(this.bindingEngine.propertyObserver(this.contextService, 'missions')
                .subscribe(async(newValue, oldValue) => {
                    this.updateLayerGroup('mission', this.contextService.missions, missionUtilities);
                }));
            overlay.push(this.getLayerGroup('mission', this.contextService.missions, missionUtilities));
        }
        try {
            this.devices = (await this.proxy.get('device').getObjects()).objects;
            if (this.devices) {
                this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async payload => {
                    if (payload.contentType.toLowerCase() === 'device') {
                        await new Promise((resolve) => setTimeout(resolve, 500)); // wait until model service has updated objects
                        this.devices = (await this.proxy.get('device').getObjects()).objects;
                        this.updateLayerGroup('device', this.devices, deviceUtilities);
                    }
                }));
                this.subscriptions.push(this.bindingEngine.propertyObserver(this, 'devices')
                    .subscribe(async(newValue, oldValue) => {
                        this.updateLayerGroup('device', this.devices, deviceUtilities);
                    }));
                overlay.push(this.getLayerGroup('device', this.devices, deviceUtilities));
            }
        } catch (error) {
            //silently handle error
        }
        try {
            this.defaultCenter = locationUtilities.getCenter(this.contextService.currentEmergencyEvent.location);
        } catch (error) {
            //silently catch error
        }
        this.subscriptions.push(this.eventAggregator.subscribe('aurelia-leaflet', event => {
            this.logger.debug('aurelia-leaflet', event);
            if (event.type.startsWith('overlay')) {
                if (event.type === 'overlayremove') {
                    this.hiddenOverlays.push(event.layer?.options?.model);
                } else if (event.type === 'overlayadd') {
                    this.hiddenOverlays.splice(this.hiddenOverlays.indexOf(event.layer?.options?.model), 1);
                }
                const layer = this.layers.overlay.find(x => x?.options?.model === event.layer?.options?.model);
                if (layer) {
                    layer.options.hidden = event.type === 'overlayremove';
                }
                localStorage.setItem('leaflet-hidden-overlays', JSON.stringify(this.hiddenOverlays));
            } else if (event.type.startsWith('popup')) {
                let activePopup;
                if (event.type === 'popupopen') {
                    activePopup = event.layer?.options?.id;
                } else if (event.type === 'popupclose') {
                    activePopup = '';
                }
                localStorage.setItem('leaflet-active-popup', activePopup);
            }
        }));
        this.layers = {overlay};
    }

    updateLayerGroup(type, objects, utilities) {
        if (objects) {
            let layers = Object.assign({}, this.layers);
            let oldAlertLayerGroup = layers.overlay.find(x => x?.options?.model === type);
            if (oldAlertLayerGroup) {
                layers.overlay.splice(layers.overlay.indexOf(oldAlertLayerGroup), 1);
            }
            layers.overlay.push(this.getLayerGroup(type, objects, utilities));
            this.layers = layers;
        }
    }

    getLayerGroup(type, objects, utilities) {
        let id = `<i class="bi-${modelUtilities.getIconByType(type)} me-1"></i>` + this.i18n.tr('model.' + type, {count: 2});
        let activePopup = localStorage.getItem('leaflet-active-popup');
        return {
            id,
            type: 'layerGroup',
            options: {model: type, hidden: this.hiddenOverlays.includes(type)},
            layers: objects.map(object => {
                let owners = this.getOwners(object.owner);
                let popupContent = `<h6><i class="bi-${modelUtilities.getIconByType(type)}"></i> ${object.name || this.i18n.tr('model.' + type)}</h6>`;
                if (object.description) {
                    popupContent += `<p>${object.description}</p>`;
                }
                if (owners.length > 0) {
                    popupContent += `<p>${owners.join(', ')}</p>`;
                }
                try {
                    popupContent += locationUtilities.getMapLinkContent(object.location);
                } catch (error) {
                    // object does not proper location with coordinates
                }
                let customPopupContent = utilities.getCustomPopupContent?.(object, this.i18n, owners);
                if (customPopupContent) {
                    popupContent += customPopupContent;
                }
                const options = Object.assign({}, utilities.getOptions?.(), {id: object.id, popup: activePopup === object.id});
                return {
                    id: object.id,
                    type: 'geoJSON',
                    divIconContent: `<i class="bi-${modelUtilities.getIconByType(type)} bg-white ${Array.isArray(object.owner) && object.owner.includes(this.userId) ? 'text-primary h5' : 'h6'}" />`,
                    data: object.location,
                    events: ['popupopen', 'popupclose'],
                    options,
                    popupContent: popupContent
                };
            })
        };
    }

    getOwners(ownerIds) {
        if (!ownerIds) ownerIds = [];
        return this.users.filter(u => ownerIds.includes(u.id)).map(u => (u.firstName || u.lastName) ? `${u.firstName} ${u.lastName} (${u.username})` : u.username);
    }

}

export {MapView};
