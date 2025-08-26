// 1. Import the necessary functions from the framework
import { createApp, defineComponent, h } from '../../packages/runtime/dist/august-js-fwk.js'

// 2. Define your root component using the defineComponent function
const Counter = defineComponent({
    // The state() function returns the component's initial data
    state() {
        return {
            count: 0,
        };
    },

    // The render() method describes the component's UI using the h() function
    render() {
        return h('div', {}, [
            h('p', {}, [`Count: ${this.state.count}`]),
            h('button', { on: { click: () => this.increment() } }, ['Increment']),
        ]);
    },

    // Custom methods can be defined to handle events and update the state
    increment() {
        // this.updateState() merges the new state and triggers a re-render
        this.updateState({ count: this.state.count + 1 });
    },
});

// 3. Create and mount the application
createApp(Counter).mount(document.getElementById('app'));