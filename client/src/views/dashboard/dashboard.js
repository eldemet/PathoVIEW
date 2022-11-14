import {inject, computedFrom} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {BindingSignaler} from 'aurelia-templating-resources';
import {weatherUtilities} from '../../utilities';
import {ContextService} from '../../services/context-service';
import {AuthService} from '../../services/auth-service';

@inject(BindingSignaler, ContextService, AuthService)
class DashboardView extends BasicView {

    openWeatherMapIconUrl = 'https://openweathermap.org/img/wn/';

    /**
     * @param {BindingSignaler} bindingSignaler
     * @param {ContextService} contextService
     * @param {AuthService} authService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(bindingSignaler, contextService, authService, ...rest) {
        super(...rest);
        this.bindingSignaler = bindingSignaler;
        this.contextService = contextService;
        this.authService = authService;
        this.weatherUtilities = weatherUtilities;
    }

    async attached() {
        await super.attached();
        this.interval = setInterval(() => this.bindingSignaler.signal('update-dates'), 1000);
        this.users = await this.authService.getUsers();
        this.roles = await this.authService.getRoles();
        this.groups = await this.authService.getGroups();
        await this.contextService.initialized;
        this.initialized = true;
    }

    detached() {
        clearInterval(this.interval);
    }

    @computedFrom('contextService.incidents')
    get lastIncident() {
        return this.contextService.incidents.at(-1);
    }

    @computedFrom('contextService.alerts')
    get lastAlert() {
        return this.contextService.alerts.at(-1);
    }

    getDate(input, format) {
        let date;
        if (input) {
            if (format === 'seconds') {
                date = new Date(input * 1000);
            } else {
                date = new Date(input);
            }
        } else {
            date = new Date();
        }
        return date;
    }

    onlineUsers = u => u.status === 'online';

    mapNames = e => e.name;

}

export {DashboardView};
