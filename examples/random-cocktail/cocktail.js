import { createApp, h, hFragment, defineComponent } from '/packages/runtime/dist/august-js-fwk.js';

const url = 'https://www.thecocktaildb.com/api/json/v1/1/random.php'
// Helper function to fetch data from the CocktailDB API
async function fetchRandomCocktail() {
    const response = await fetch(url);
    const data = await response.json();
    return data.drinks[0];
}

// Define the root component
// Use `defineComponent` to create a new stateful component
const RandomCocktail = defineComponent({
    state() {
        // `state()` returns the component's initial data
        return {
            isLoading: false,
            cocktail: null,
        }
    },
    // `render()` describes the UI based on the current state
    // It returns a Virtual DOM tree using the `h()` functions
    render() {
        const { isLoading, cocktail } = this.state;
        // -- Conditional Rendering --
        // Show a loading message while fetching data
        if (isLoading) {
            // `hFragment` groups multiple elements without a single root
            return hFragment([
                h('h1', {}, ['Random Cocktail']),
                h('p', {}, ['Loading...']),
            ]);
        }
        // Show the initial button if no cocktail has been fetched yet
        if (!cocktail) {
            return hFragment([
                h('h1', {}, ['Random Cocktail']),
                // `on: { click: ... }` registers an event handler
                // The framework automatically binds `this` correctly
                h('button', { on: { click: this.fetchCocktail }}, [
                    'Get a cocktail',
                ]),
            ]);
        }
        // When data is available, display the cocktail details
        const { strDrink, strDrinkThumb, strInstructions } = cocktail;

        return hFragment([
            h('h1', {}, [strDrink]),
            h('p', {}, [strInstructions]),
            // `h()` is used to create standard HTML elements with props
            h('img', {
                src: strDrinkThumb,
                alt: strDrink,
                style: { width: '300px', height: '300px' },
            }),
            h(
                'button',
                {
                    on: { click: this.fetchCocktail },
                    style: { display: 'block', margin: '1em auto' },
                },
                ['Get another cocktail']
            ),
        ]);
    },
    // Custom methods handle logic and state updates
    async fetchCocktail() {
        // `updateState` merges the new data and triggers a re-render
        this.updateState({ isLoading: true, cocktail: null });
        const cocktail = await fetchRandomCocktail();

        // Use setTimeout to simulate a longer loading time
        setTimeout(() => {
            this.updateState({ isLoading: false, cocktail });
        }, 1000);
    },
});

// `createApp` takes the root component and creates an app instance
// `.mount()` tells the framework where to render the app on the page
createApp(RandomCocktail).mount(document.getElementById('app'));