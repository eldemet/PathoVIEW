import {v1 as uuid} from 'uuid';
import {BhapticsPlayer, ErrorCode} from 'tact-js';
import {PositionType} from 'tact-js';
import {BhapticsService} from './bhaptics-service';

class TactJsUtils {

    static convertErrorCodeToString = (error) => {
        switch (error) {
            case ErrorCode.CONNECTION_NOT_ESTABLISHED:
                return 'Connection is not established.';
            case ErrorCode.FAILED_TO_SEND_MESSAGE:
                return 'Failed to send a request to the bHaptics Player';
            case ErrorCode.MESSAGE_NOT_DEFINED:
                return 'Message is not defined';
            case ErrorCode.MESSAGE_INVALID:
                return 'Invalid input: Unknown';
            case ErrorCode.MESSAGE_INVALID_DURATION_MILLIS:
                return 'Invalid: durationMillis [20ms ~ 100,000ms]';
            case ErrorCode.MESSAGE_INVALID_DOT_INDEX_VEST:
                return 'Invalid: VestFront/Back index should be [0, 19]';
            case ErrorCode.MESSAGE_INVALID_DOT_INDEX_ARM:
                return 'Invalid: ArmLeft/Right index should be [0, 5]';
            case ErrorCode.MESSAGE_INVALID_DOT_INDEX_HEAD:
                return 'Invalid: Head index should be [0, 5]';
            case ErrorCode.MESSAGE_INVALID_INTENSITY:
                return 'Invalid: intensity should be [0, 100]';
            case ErrorCode.MESSAGE_INVALID_X:
                return 'Invalid: x should be [0, 1]';
            case ErrorCode.MESSAGE_INVALID_Y:
                return 'Invalid: y should be [0, 1]';
            case ErrorCode.MESSAGE_INVALID_ROTATION_X:
                return 'Invalid: rotationOffsetX should be [0, 360]';
            case ErrorCode.MESSAGE_INVALID_ROTATION_Y:
                return 'Invalid: offsetY should be [-0.5, 0.5]';
            case ErrorCode.MESSAGE_INVALID_SCALE_INTENSITY_RATIO:
                return 'Invalid: intensity should be [0.2, 5]';
            case ErrorCode.MESSAGE_INVALID_SCALE_DURATION_RATIO:
                return 'Invalid: duration should be [0.2, 5]';
            case ErrorCode.MESSAGE_NOT_REGISTERED_KEY:
                return 'Invalid: key not registered';
            case ErrorCode.SUCCESS:
                return 'Success';
            default:
                return 'Unknown error';
        }
    };

}

class BhapticsServiceImplementation extends BhapticsService {

    async initialize() {
        this.status = 'connecting';
        BhapticsPlayer.initialize(uuid(), 'PathoVIEW');
        BhapticsPlayer.turnOffAll();
        let prevState = undefined;
        BhapticsPlayer.addListener(async msg => {
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
        BhapticsPlayer.turnOffAll();
        // @ts-ignore
        BhapticsPlayer.socket.handlers = [];
        // @ts-ignore
        BhapticsPlayer.socket.websocketClient.close();
        // @ts-ignore
        BhapticsPlayer.socket = null;
        await super.close();
    }

    async pingAll() {
        let code = BhapticsPlayer.submitDot('test', PositionType.VestBack, [{index: 0, intensity: 100}], 1000);
        this.log(code, 'register', 'ping all');
    }

    async register(tactFile) {
        let code = BhapticsPlayer.registerFile(tactFile.fileName, tactFile.content);
        this.log(code, 'register', tactFile.fileName);
    }

    async submitRegistered(callRegistered) {
        let code = BhapticsPlayer.submitRegistered(callRegistered.name);
        this.log(code, 'submitRegistered', callRegistered.name);
    }

    log(code, functionName, name) {
        let message = TactJsUtils.convertErrorCodeToString(code);
        let type = code === 0 ? 'debug' : 'warn';
        this.logger[type](`${functionName} (${name}): ${message}`);
    }

}

export {BhapticsServiceImplementation};
