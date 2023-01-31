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
        let user;
        try {
            this.users = await this.authService.getUsers();
            user = this.users.find(u => u.id === this.value[0]);
        } catch (error) {
            this.logger.silly(error.message);
        }
        this.user = user;
    }

    getAbbreviation(user) {
        return userUtilities.getAbbreviation(user);
    }

}

export {CustomDetailPropertyOwner};
