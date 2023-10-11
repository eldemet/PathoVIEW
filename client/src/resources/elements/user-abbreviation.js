import {bindable} from 'aurelia-framework';
import {BasicComponent} from 'library-aurelia/src/prototypes/basic-component';
import {userUtilities} from '../../utilities';

class UserAbbreviation extends BasicComponent {

    @bindable userId;

    /**
     * @param {ConstructorParameters<typeof BasicComponent>} rest
     */
    constructor(...rest) {
        super(...rest);
        this.authService = this.proxy.get('auth');
    }

    async attached() {
        let user;
        try {
            this.users = (await this.authService.getUsers()).objects;
            user = this.users.find(u => u.id === this.userId);
        } catch (error) {
            this.logger.silly(error.message);
        }
        this.user = user;
    }

    getAbbreviation(user) {
        return userUtilities.getAbbreviation(user);
    }

}

export {UserAbbreviation};
