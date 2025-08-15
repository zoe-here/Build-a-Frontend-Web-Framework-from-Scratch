import { createApp, h, hFragment } from 'https://unpkg.com/august-js-fwk@2'

// Define the state
const state = {
    // The text of the new to-do item that the user is typing in the input field
    currentTodo: '',
    edit: {
        // The index of the to-do item in the todos array that’s being edited
        idx: null,
        // The original text of the to-do item before the user started editing it
        original: null,
        // The text of the to-do item as the user is editing it
        edited: null,
    },
    todos: ['Walk the dog', 'Water the plants'],
}

// Define the reducers
const reducers = {
    'update-current-todo': (state, currentTodo) => ({
        // Make a shallow copy
        ...state,
        currentTodo,
    }),

    'add-todo': (state) => ({
        ...state,
        // To clean the field
        currentTodo: '',
        todos: [...state.todos, state.currentTodo],
    }),

    'start-editing-todo': (state, idx) => ({
        ...state,
        edit: {
            idx,
            // Save it in case the edition is canceled
            original: state.todos[idx],
            edited: state.todos[idx],
        },
    }),

    'edit-todo': (state, edited) => ({
        ...state,
        edit: { ...state.edit, edited },
    }),

    'save-edited-todo': (state) => {
        const todos = [...state.todos]
        todos[state.edit.idx] = state.edit.edited

        return {
            ...state,
            // Reset edit part of the state
            edit: { idx: null, original: null, edited: null },
            todos,
        }
    },

    'cancel-editing-todo': (state) => ({
        ...state,
        edit: { idx: null, original: null, edited: null },
    }),

    'remove-todo': (state, idx) => ({
        ...state,
        // Filter out the item with given index
        todos: state.todos.filter((_, i) => i !== idx),
    }),
}

// Define the view

// Top-level
function App(state, emit) {
    return hFragment([
        h('h1', {}, ['My TODOs']),
        CreateTodo(state, emit),
        TodoList(state, emit),
    ])
}

// Destructure the currentTodo from the state object
function CreateTodo({ currentTodo }, emit) {
    return h('div', {}, [
        h('label', { for: 'todo-input' }, ['New TODO']),
        h('input', {
            type: 'text',
            id: 'todo-input',
            value: currentTodo,
            on: {
                input: ({ target }) =>
                    emit('update-current-todo', target.value),
                keydown: ({ key }) => {
                    if (key === 'Enter' && currentTodo.length >= 3) {
                        // Dispatch the command
                        emit('add-todo')
                    }
                },
            },
        }),
        h(
            'button',
            {
                disabled: currentTodo.length < 3,
                on: { click: () => emit('add-todo') },
            },
            ['Add']
        ),
    ])
}

function TodoList({ todos, edit }, emit) {
    return h(
        'ul',
        {},
        todos.map((todo, i) => TodoItem({ todo, i, edit }, emit))
    )
}

function TodoItem({ todo, i, edit }, emit) {
    const isEditing = edit.idx === i

    return isEditing
        // The item in edit mode
        ? h('li', {}, [
            h('input', {
                value: edit.edited,
                on: {
                    input: ({ target }) => emit('edit-todo', target.value)
                },
            }),
            h(
                'button',
                {
                    on: {
                        click: () => emit('save-edited-todo')
                    }
                },
                ['Save']
            ),
            h(
                'button',
                {
                    on: {
                        click: () => emit('cancel-editing-todo')
                    }
                },
                ['Cancel']
            ),
        ])
        // The item in read mode
        : h('li', {}, [
            h(
                'span',
                {
                    on: {
                        dblclick: () => emit('start-editing-todo', i)
                    }
                },
                [todo]
            ),
            h(
                'button',
                {
                    on: {
                        click: () => emit('remove-todo', i)
                    }
                },
                ['Done']
            ),
        ])
}

createApp({ state, reducers, view: App }).mount(document.body)