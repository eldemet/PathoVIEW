import {CapacitorConfig} from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'pathocert.iao.fraunhofer.de',
    appName: 'pathoview-client',
    webDir: 'dist',
    bundledWebRuntime: false,
    plugins: {
        LocalNotifications: {
            smallIcon: "ic_launcher_foreground",
            iconColor: "#488AFF",
            sound: "beep.wav"
        },
        CapacitorCookies: {
            enabled: true
        }
    },
    android: {
        path: '../../pathoview-android-middleware'
    }
};

export default config;
