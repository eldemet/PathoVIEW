import {inject} from 'aurelia-framework';
import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';
import {weatherUtilities} from '../../utilities';
import {ContextService} from '../../services/context-service';

@inject(ContextService)
class DashboardView extends BasicViewExtended {

    openWeatherMapIconUrl = 'https://openweathermap.org/img/wn/';

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
