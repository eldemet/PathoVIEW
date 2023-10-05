import {BasicComposableAuFormItemEnum} from 'library-aurelia/src/prototypes/basic-composable-au-form-item-enum';

/**
 * @extends BasicComposableAuFormItemEnum
 * @category resources
 * @subcategory custom-elements
 *
 * @example
 * <require from="library-aurelia/src/resources/elements/au-form/au-form-item-select"></require>
 *
 * <compose ref="formItemCompose"
 *          model.bind="{object: object,
 *                       propertyKey: propertyKey,
 *                       schema: schema,
 *                       index: index}"
 *          view-model="${composeViewModel()}"
 *          view="${composeViewModel() + '.html'}">
 * </compose>
 */
class CustomFormItemRole extends BasicComposableAuFormItemEnum {

    async initialize() {
        await super.initialize();
        let roles = (await this.proxy.get('context').getRolesOfCurrentEmergencyEvent()).map(role => role.id);
        this.enum = this.enum.filter(e => roles.includes(e.value));
    }

}

export {CustomFormItemRole};
