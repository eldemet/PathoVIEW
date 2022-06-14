import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';
import {weatherUtilities} from '../../utilities';

class DashboardView extends BasicViewExtended {

    openWeatherMapIconUrl = 'http://openweathermap.org/img/wn/';

    currentWeather = {
        'coord': {'lon': 9, 'lat': 48},
        'weather': [
            {
                'id': 802,
                'main': 'Clouds',
                'description': 'scattered clouds',
                'icon': '03d'
            }
        ],
        'base': 'stations',
        'main': {
            'temp': 19.4,
            'feels_like': 18.52,
            'temp_min': 17.32,
            'temp_max': 21.67,
            'pressure': 1022,
            'humidity': 43,
            'sea_level': 1022,
            'grnd_level': 938
        },
        'visibility': 10000,
        'wind': {
            'speed': 2.81,
            'deg': 66,
            'gust': 2.01
        },
        'clouds': {'all': 40},
        'dt': 1654869958,
        'sys': {'type': 2, 'id': 19490, 'country': 'DE', 'sunrise': 1654831489, 'sunset': 1654888934},
        'timezone': 7200,
        'id': 2942451,
        'name': 'Buchheim',
        'cod': 200
    };

    constructor(...rest) {
        super(...rest);
        this.weatherUtilities = weatherUtilities;
    }

}

export {DashboardView};
