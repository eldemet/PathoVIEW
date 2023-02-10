import HapticPlayer from 'tact-js/dist/lib/HapticPlayer';
import {TactJsUtils} from 'tact-js/dist/lib/tact-js';
import {PositionType} from 'tact-js';
import {BhapticsService} from './bhaptics-service';

class BhapticsServiceImplementation extends BhapticsService {

    async initialize() {
        this.status = 'connecting';
        this.tactJs = new HapticPlayer();
        this.tactJs.turnOffAll();
        let prevState = undefined;
        this.tactJs.addListener(async msg => {
            if (prevState !== msg.status && msg.status === 'Connected') {
                this.logger.info('bhaptics connected!');
                this.status = 'connected';
                await super.initialize();
            } else if (prevState !== msg.status && msg.status === 'Disconnected') {
                this.logger.info('bhaptics disconnected!');
                this.status = 'error';
            } else if (prevState !== msg.status && msg.status === 'Connecting') {
                this.logger.info('bhaptics connecting...');
                this.status = 'connecting';
            }
            prevState = msg.status;
        });
    }

    async close() {
        this.tactJs.turnOffAll();
        this.tactJs.socket.handlers = [];
        this.tactJs.socket.connect = function() {
        };
        this.tactJs.socket.websocketClient.onclose = function() {
        };
        this.tactJs.socket.websocketClient.close();
        this.tactJs = null;
        await super.close();
    }

    async pingAll() {
        let code = this.tactJs.submitDot('test', PositionType.VestBack, [{index: 0, intensity: 100}], 1000);
        this.log(code, 'register', 'ping all');
    }

    async register(tactFile) {
        let code = this.tactJs.registerFile(tactFile.fileName, tactFile.content);
        this.log(code, 'register', tactFile.fileName);
    }

    async submitRegistered(callRegistered) {
        let code = this.tactJs.submitRegistered(callRegistered.name);
        this.log(code, 'submitRegistered', callRegistered.name);
    }

    log(code, functionName, name) {
        let message = TactJsUtils.convertErrorCodeToString(code);
        let type = code === 0 ? 'debug' : 'warn';
        this.logger[type](`${functionName} (${name}): ${message}`);
    }

}

export {BhapticsServiceImplementation};
