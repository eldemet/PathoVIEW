/***
 * loading event decorator
 *
 * @category decorators
 * @description decorator that sends loading event and dismiss after finish
 *
 * @param {String} eventTarget send event to specified target with the eventAggregator
 * @param {Object} modelType event model type
 * @returns {function(*, *, *): *}
 */
const loadingEvent = (eventTarget, modelType) => {

    return (target, propertyKey, descriptor) => {
        const targetMethod = descriptor.value;
        descriptor.value = function(...args) {
            this.eventAggregator.publish(eventTarget, {type: 'loading', message: 'alerts.general.loading', translateOptions: {type: modelType}});
            let result = targetMethod.apply(this, args);
            if (result && result instanceof Promise) {
                result = result.then(data => {
                    this.eventAggregator.publish(eventTarget + '-dismiss');
                    return data;
                });
            } else {
                this.eventAggregator.publish(eventTarget + '-dismiss');
            }
            return result;
        };
        return descriptor;
    };

};

export {loadingEvent};
