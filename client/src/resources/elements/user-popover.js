import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';

/**
 * @extends BasicComposable
 * @category resources
 * @subcategory custom-elements
 *
 */
class UserPopover extends BasicComposable {

    /**
     * @param {ConstructorParameters<typeof BasicComposable>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.authService = this.proxy.get('auth');
    }

}

export {UserPopover};
