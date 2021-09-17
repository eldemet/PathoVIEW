import {inject} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {PromptDialog} from 'library-aurelia/src/resources/dialogs/prompt-dialog';
import {BasicViewExtended} from 'library-aurelia/src/prototypes/basic-view-extended';

@inject(DialogService)
export class ComponentsView extends BasicViewExtended {

    bootstrapIcons = [
        'alarm',
        'bell-fill',
        'camera-fill',
        'camera-video-fill',
        'chat-fill',
        'check-lg',
        'clipboard',
        'code-slash',
        'envelope-fill',
        'exclamation-triangle-fill',
        'gift-fill',
        'hammer',
        'info-lg',
        'lightbulb-fill',
        'lock-fill',
        'person-fill',
        'pie-chart-fill',
        'shield-lock-fill',
        'signpost-2-fill',
        'star-fill',
        'tag-fill',
        'trash-fill',
        'unlock-fill',
        'wrench'
    ];

    constructor(dialogService, ...rest) {
        super(...rest);
        this.dialogService = dialogService;
    }

    openPromptDialog(title, question, biIcon) {
        this.dialogService.open({
            viewModel: PromptDialog,
            model: {title: title, question: question, biIcon: biIcon},
            lock: false,
            overlayDismiss: false,
            keyboard: ['Escape', 'Enter']
        }).whenClosed(response => {
            this.logger.info('PropmptDialog was ' + (response.wasCancelled ? 'cancelled' : 'accepted'));
        }).catch(error => {
            this.logger.error(error);
        });
    }

}
