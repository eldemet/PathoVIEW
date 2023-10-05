import {BasicView} from 'library-aurelia/src/prototypes/basic-view';

class InfoView extends BasicView {

    /**
     * @param {ConstructorParameters<typeof BasicView>} rest
     */
    constructor(...rest) {
        super(...rest);
        // @ts-ignore
        this.appVersion = APP_VERSION; // eslint-disable-line no-undef
        // @ts-ignore
        this.appLicense = APP_LICENSE; // eslint-disable-line no-undef
        // @ts-ignore
        this.appAuthor = APP_AUTHOR; // eslint-disable-line no-undef
        // @ts-ignore
        this.appDependencies = APP_DEPENDENCIES; // eslint-disable-line no-undef
    }

}

export {InfoView};
