import {inlineView} from 'aurelia-framework';
import {ToolbarElementDarkmodeSwitch} from 'library-aurelia/src/resources/elements/toolbar/toolbar-element-darkmode-switch';

@inlineView(
    `
    <template>
        <div class="form-check form-switch form-check-reverse mx-2 d-inline-block"
         bs-color-scheme.bind="text">
            <label class="form-check-label ps-2"
                   for="darkModeSwitch">
                <i class="bi bi-moon-fill"></i>
            </label>
            <input type="checkbox"
                   class="form-check-input"
                   id="darkModeSwitch"
                   checked.bind="isDarkMode"
                   change.delegate="darkModeChanged()"
                   disabled.bind="isAutoDarkMode">
        </div>
    </template>
    `
)
class ToolbarElementDarkmodeSwitchAdapted extends ToolbarElementDarkmodeSwitch {


}

export {ToolbarElementDarkmodeSwitchAdapted};
