import {BindingEngine, inject} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {modelUtilities, alertUtilities, deviceUtilities, missionUtilities, locationUtilities} from '../../utilities';
import {ContextService} from '../../services/context-service';

@inject(BindingEngine, ContextService)
class MapView extends BasicView {

    /**
     *
     * @param {BindingEngine}bindingEngine
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(bindingEngine, contextService, ...rest) {
        super(...rest);
        this.bindingEngine = bindingEngine;
        this.contextService = contextService;
    }

    async attached() {
        super.attached();
        await this.contextService.initialized;
        this.users = await this.proxy.get('auth').getUsers();
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
                this.subscriptions.push(this.eventAggregator.subscribe('notification-model', async notification => {
                    if (notification.contentType.toLowerCase() === 'device') {
                        this.devices = (await this.proxy.get('device').getObjects()).objects;
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
            id: `<i class="bi-${modelUtilities.getIconByType(type)} me-1"></i>` + this.i18n.tr('model.' + type, {count: 2}),
            type: 'layerGroup',
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
                return {
                    id: object.id,
                    type: 'geoJSON',
                    divIconContent: `<i class="bi-${modelUtilities.getIconByType(type)} bg-white ${Array.isArray(object.owner) && object.owner.includes(this.userId) ? 'text-primary h5' : 'h6'}" />`,
                    data: object.location,
                    options: utilities.getOptions?.(),
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
