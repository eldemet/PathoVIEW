'use strict';
const queryString = require('query-string');
const fetch = require('node-fetch');
const createError = require('http-errors');
const logger = require('utilities-node/src/utilities/logger')(module);
const {loadFile} = require('utilities-node/src/utilities/fs');

/**
 * @module paths/weather/current
 * @category paths
 * @param {ConfigWithAdditions} config
 */
module.exports = function(config) {

    const owmapikey = loadFile(config.server.openWeatherMapApiKeyFile);

    let operations = {
        GET: logger.catchErrors(GET)
    };

    operations.GET['apiDoc'] = getCurrentWeatherSchema;

    async function GET(req, res) {
        let params = Object.assign({}, req.query, {appid: owmapikey});
        let url = 'https://api.openweathermap.org/data/2.5/weather?' + queryString.stringify(params, {arrayFormat: 'comma'});
        let result = await (await fetch(url, {
            headers: {
                'Accept': 'application/json',
                'content-type': 'application/json'  //must match body
            },
            mode: 'cors', // no-cors, *same-origin
            method: 'GET'
        })).json();
        if (result.cod !== 200) {
            throw createError(parseInt(result.cod), result.message);
        }
        res.validateAndSend(200, result);
    }

    return operations;
};

const getCurrentWeatherSchema = {
    summary: 'Returns weather data from OpenWeatherMap',
    operationId: 'getCurrentWeather',
    parameters: [
        {
            in: 'query',
            name: 'lat',
            description: '',
            schema: {
                type: 'number'
            },
            required: true
        },
        {
            in: 'query',
            name: 'lon',
            description: '',
            schema: {
                type: 'number'
            },
            required: true
        },
        {
            in: 'query',
            name: 'units',
            description: '',
            schema: {
                type: 'string',
                enum: [
                    'standard', // Kelvin °K
                    'imperial', // Fahrenheit °F
                    'metric' // Celsius °C
                ]
            },
            required: false
        },
        {
            in: 'query',
            name: 'mode',
            description: '',
            schema: {
                type: 'string',
                enum: [
                    'xml',
                    'html'
                    // do not set parameter for JSON
                ]
            },
            required: false
        },
        {
            in: 'query',
            name: 'lang',
            description: '',
            schema: {
                type: 'string'
            },
            required: false
        },
        {
            $ref: '#/components/parameters/language'
        }
    ],
    responses: {
        200: {
            description: 'Success',
            content: {
                'application/json': {
                    schema: {
                        type: 'object',
                        required: [
                            'coord',
                            'weather',
                            'base',
                            'main',
                            'visibility',
                            'wind',
                            'clouds',
                            'dt',
                            'sys',
                            'timezone',
                            'id',
                            'name',
                            'cod'
                        ],
                        properties: {
                            coord: {
                                type: 'object',
                                required: ['lat', 'lon'],
                                properties: {
                                    lat: {type: 'number'},
                                    lon: {type: 'number'}
                                }
                            },
                            weather: {
                                type: 'array',
                                items: {
                                    required: [
                                        'id',
                                        'main',
                                        'description',
                                        'icon'
                                    ],
                                    properties: {
                                        id: {type: 'number'},
                                        main: {type: 'string'},
                                        description: {type: 'string'},
                                        icon: {type: 'string'}
                                    }
                                }
                            },
                            base: {type: 'string'},
                            main: {
                                type: 'object',
                                properties: {
                                    temp: {type: 'number'},
                                    feels_like: {type: 'number'},
                                    temp_min: {type: 'number'},
                                    temp_max: {type: 'number'},
                                    pressure: {type: 'number'},
                                    humidity: {type: 'number'}
                                }
                            },
                            visibility: {type: 'number'},
                            wind: {
                                type: 'object',
                                required: [
                                    'speed',
                                    'deg'
                                ],
                                properties: {
                                    speed: {type: 'number'},
                                    deg: {type: 'number'}
                                }
                            },
                            clouds: {
                                type: 'object',
                                properties: {
                                    all: {type: 'number'}
                                }
                            },
                            dt: {type: 'number'},
                            sys: {
                                type: 'object',
                                properties: {
                                    type: {type: 'number'},
                                    id: {type: 'number'},
                                    message: {type: 'number'},
                                    country: {type: 'string'},
                                    sunrise: {type: 'number'},
                                    sunset: {type: 'number'}
                                }
                            },
                            timezone: {type: 'number'},
                            id: {type: 'number'},
                            name: {type: 'string'},
                            cod: {type: 'number'}
                        }
                    }
                }
            }
        },
        default: {
            $ref: '#/components/responses/Error'
        }
    }
};
