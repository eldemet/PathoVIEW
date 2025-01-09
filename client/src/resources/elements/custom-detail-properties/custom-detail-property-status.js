import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';

class CustomDetailPropertyStatus extends BasicComposable {

    propertyKey;
    schema;
    object;

    timeout;

    async toggleStatus(status) {
        if (this.timeout) clearTimeout(this.timeout);
        this.value = this.schema.enum[(this.schema.enum.indexOf(status) + 1) % this.schema.enum.length];
        this.timeout = setTimeout(() => this.saveStatus(), 2000);
    }

    async saveStatus() {
        await this.proxy.get('mission').updateObject(Object.assign({}, this.object, {[this.propertyKey]: this.value}));
        this.object[this.propertyKey] = this.value;
    }

    detached() {
        if (this.timeout) clearTimeout(this.timeout);
    }

}

export {CustomDetailPropertyStatus};
