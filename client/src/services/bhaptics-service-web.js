import {inject} from "aurelia-framework";
import TactJs from 'tact-js';
import {BhapticsService} from "./bhaptics-service";
import {heartbeat} from "../assets/tact-files";

@inject(TactJs)
class BhapticsServiceImplementation extends BhapticsService {

    /**
     * @param {ConstructorParameters<typeof BhapticsService>} rest
     */
    constructor(tactJs, ...rest) {
        super(...rest);
        this.tactJs = tactJs;
    }

    async initialize() {
        await super.initialize();
        this.tactJs.turnOffAll();
        let prevState = undefined;
        this.tactJs.addListener((msg) => {
            if (prevState !== msg.status && msg.status === 'Connected') {
                let code = this.tactJs.registerFile('heartbeat', heartbeat);
                if (code === 0) {
                    this.logger.info('bhaptics connected!');
                } else {
                    this.logger.debug('bhaptics error ' + code);
                }
            } else if (prevState !== msg.status && msg.status === 'Disconnected') {
                this.logger.info('bhaptics disconnected!');
            } else if (prevState !== msg.status && msg.status === 'Connecting') {
                this.logger.info('bhaptics connecting...');
            }
            prevState = msg.status;
        });
    }

    async submitRegistered() {
        let i = 0;
        let interval = setInterval(async () => {
            let code = this.tactJs.submitRegistered('heartbeat');
            if (code !== 0) {
                this.logger.debug('bhaptics error ' + code);
            }
            i++;
            if (i > 5) {
                clearInterval(interval);
            }
        }, 1000);
    }

}

export {BhapticsServiceImplementation};
