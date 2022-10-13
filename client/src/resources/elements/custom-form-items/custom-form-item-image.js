import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';

/**
 * @extends BasicComposable
 * @category resources
 * @subcategory custom-elements
 *
 * @example
 * <require from="./resources/elements/custom-form-items/custom-form-item-image"></require>
 *
 */
class CustomFormItemImage extends BasicComposable {

    activate(model) {
        super.activate(model);
        if (this.propertySchema.required) {
            this.mode = 'camera';
        }
    }

    onFileSelectedChanged() {
        let reader = new FileReader();
        reader.addEventListener('load', () => {
            this.object[this.propertyKey] = reader.result;
        }, false);

        if (this.imageFile.files[0]) {
            reader.readAsDataURL(this.imageFile.files[0]);
        }
    }

}

export {CustomFormItemImage};
