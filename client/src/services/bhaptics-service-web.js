import {inject} from "aurelia-framework";
import TactJs from 'tact-js';
import {BhapticsService} from "./bhaptics-service";

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
                this.logger.info('bhaptics connected!');
            } else if (prevState !== msg.status && msg.status === 'Disconnected') {
                this.logger.info('bhaptics disconnected!');
            } else if (prevState !== msg.status && msg.status === 'Connecting') {
                this.logger.info('bhaptics connecting...');
            }
            prevState = msg.status;
        });
    }

    async register(tactFile) {
        let code = this.tactJs.registerFile(tactFile.fileName, tactFile.content);
        if (code !== 0) {
            this.logger.debug('bhaptics error ' + code);
        }
    }

    async submitRegistered(callRegistered) {
        let code = this.tactJs.submitRegistered(callRegistered.name);
        if (code !== 0) {
            this.logger.debug('bhaptics error ' + code);
        }
    }

}

export {BhapticsServiceImplementation};
