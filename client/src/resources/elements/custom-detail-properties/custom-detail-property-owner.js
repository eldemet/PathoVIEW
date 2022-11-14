import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';
import {userUtilities} from '../../../utilities';

class CustomDetailPropertyOwner extends BasicComposable {

    value;
    propertyKey;
    schema;
    layer;

    /**
     * @param {ConstructorParameters<typeof BasicComposable>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    activate(model) {
        super.activate(model);
        this.authService = this.proxy.get('auth');
    }

    async attached() {
        this.users = await this.authService.getUsers();
        const user = this.users.find(u => u.id === this.value[0]);
        this.user = user ? user : 'notDefined';
    }

    getAbbreviation(user) {
        return userUtilities.getAbbreviation(user);
    }

}

export {CustomDetailPropertyOwner};
