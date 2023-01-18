import HapticPlayer from 'tact-js/dist/lib/HapticPlayer';
import {PositionType} from "tact-js";
import {BhapticsService} from "./bhaptics-service";

class BhapticsServiceImplementation extends BhapticsService {

    async initialize() {
        this.status = 'connecting';
        this.tactJs = new HapticPlayer();
        this.tactJs.turnOffAll();
        let prevState = undefined;
        this.tactJs.addListener((msg) => {
            if (prevState !== msg.status && msg.status === 'Connected') {
                this.logger.info('bhaptics connected!');
                this.status = 'connected';
            } else if (prevState !== msg.status && msg.status === 'Disconnected') {
                this.logger.info('bhaptics disconnected!');
                this.status = 'error';
            } else if (prevState !== msg.status && msg.status === 'Connecting') {
                this.logger.info('bhaptics connecting...');
                this.status = 'connecting';
            }
            prevState = msg.status;
        });
        await super.initialize();
    }

    async close() {
        this.tactJs.turnOffAll();
        this.tactJs.socket.handlers = [];
        this.tactJs.socket.connect = function () {};
        this.tactJs.socket.websocketClient.onclose = function () {};
        this.tactJs.socket.websocketClient.close();
        this.tactJs = null;
        await super.close();
    }

    async pingAll() {
        let code = this.tactJs.submitDot('test', PositionType.VestBack, [{index: 0, intensity: 100}], 1000);;
        if (code !== 0) {
            this.logger.debug('bhaptics error ' + code);
        }
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
