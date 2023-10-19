import {BasicDialog} from 'library-aurelia/src/prototypes/basic-dialog';

/**
 * @extends BasicDialog
 * @subcategory dialogs
 */
class CameraDialog extends BasicDialog {

    imageData;

    /**
     * @param {ConstructorParameters<typeof BasicDialog>} rest
     */
    constructor(...rest) {
        super(...rest);
    }

    close(isCancel) {
        if (isCancel) {
            this.dialogController.cancel();
        } else {
            this.dialogController.ok({imageData: this.imageData});
        }
    }

}

export {CameraDialog};
