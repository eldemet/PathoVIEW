import {BasicComposable} from 'library-aurelia/src/prototypes/basic-composable';

class CustomDetailPropertyStatus extends BasicComposable {

    propertyKey;
    schema;
    object;

    async toggleStatus(status) {
        this.value = this.schema.enum[(this.schema.enum.indexOf(status) + 1) % this.schema.enum.length];
        await this.proxy.get('mission').updateObject(Object.assign({}, this.object, {[this.propertyKey]: this.value}));
        this.object[this.propertyKey] = this.value;
    }

}

export {CustomDetailPropertyStatus};
