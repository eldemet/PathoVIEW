import {BasicComposableAuFormItem} from 'library-aurelia/src/prototypes/basic-composable-au-form-item';

/**
 * @extends BasicComposableAuFormItem
 * @subcategory custom-elements
 *
 * @example
 * <require from="library-aurelia/src/resources/elements/au-form/au-form-item-date-time"></require>
 *
 * <compose ref="formItemCompose"
 *          model.bind="{object: object,
 *                       propertyKey: propertyKey,
 *                       propertySchema: propertySchema,
 *                       index: index}"
 *          view-model="${composeViewModel()}"
 *          view="${composeViewModel() + '.html'}">
 * </compose>
 */
class CustomFormItemDateTime extends BasicComposableAuFormItem {

    dateTime = '';

    dateTimeChanged() {
        let date;
        try {
            date = new Date(this.dateTime).toISOString();
        } catch (error) {
            //silently catch error
        }
        this.object[this.propertyKey] = date;
    }

}

export {CustomFormItemDateTime};
