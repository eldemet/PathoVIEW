import {inject} from 'aurelia-framework';
import {BasicView} from 'library-aurelia/src/prototypes/basic-view';
import {weatherUtilities} from '../../utilities';
import {ContextService} from '../../services/context-service';

@inject(ContextService)
class DashboardView extends BasicView {

    openWeatherMapIconUrl = 'https://openweathermap.org/img/wn/';

    /**
     * @param {ContextService} contextService
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(contextService, ...rest) {
        super(...rest);
        this.contextService = contextService;
        this.weatherUtilities = weatherUtilities;
    }

    getDate(seconds) {
        return new Date(seconds * 1000);
    }

}

export {DashboardView};
