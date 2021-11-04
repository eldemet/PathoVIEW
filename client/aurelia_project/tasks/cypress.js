import cypress from 'cypress';
import config from '../../cypress.config';
import {CLIOptions} from 'aurelia-cli';
import {default as runAppServer, shutdownDevServer} from './run';

const runCypress = (cb) => {
    if (CLIOptions.hasFlag('run')) {
        cypress
            .run({...config, configFile: false})
            .then(results => {
                shutdownDevServer();
                setTimeout(() => {
                    process.exit(results.totalFailed > 0 ? 1 : 0);
                }, 100);
            })
            .catch(cb);
    } else {
        cypress.open(config);
    }
};

export default (cb) => {
    if (CLIOptions.hasFlag('start')) {
        runAppServer();
        runCypress(cb);
        return;
    }

    runCypress(cb);
};
