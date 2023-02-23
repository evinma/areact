import { describe, it, expect } from "vitest";
import AReact from './AReact';

const sleep = ms => new Promise((resolve) => setTimeout(resolve, ms));

describe('areact jsx with props', () => {
    it('should render jsx concurrent', async () => {
        const container = document.createElement('div');
        const element = (
            <div id="foo" className="test">
                <div id="bar">hello</div>
                <div id="bar1">world</div>
            </div>
        )
        console.log('element', JSON.stringify(element))
        const root = AReact.createRoot(container);
        
        await AReact.act(() => {
            root.render(element);
            console.log('innerHtml', container.innerHTML)
            expect(container.innerHTML).toBe('');
        })
        expect(container.innerHTML).toBe('<div id="foo" class="test"><div id="bar">hello</div><div id="bar1">world</div></div>');
    })
})
describe('areact jsx with function component', () => {
    it('should render function component', async () => {
        const container = document.createElement('div');
        function App() {
            return (
                <div id="foo" className="test">
                    <div id="bar">hello</div>
                    <div id="bar1">world</div>
                </div>
            )
        }

        const element = (
            <App />
        )
        const root = AReact.createRoot(container);
        
        await AReact.act(() => {
            root.render(element);
            console.log('innerHtml', container.innerHTML)
            expect(container.innerHTML).toBe('');
        })
        expect(container.innerHTML).toBe('<div id="foo" class="test"><div id="bar">hello</div><div id="bar1">world</div></div>');
    })
    it('should render nested function component', async () => {
        const container = document.createElement('div');
        function App(props) {
            return (
                <div id="foo" className="test">
                    <div id="bar">{props.title}</div>
                    <div id="bar1">world</div>
                    {props.children}
                </div>
            )
        }

        const element = (
            <App title='main title'>
                <div>sub title</div>
            </App>
        )
        const root = AReact.createRoot(container);
        
        await AReact.act(() => {
            root.render(element);
            console.log('innerHtml', container.innerHTML)
            expect(container.innerHTML).toBe('');
        })
        console.log('innerHtml', container.innerHTML)
        expect(container.innerHTML).toBe('<div id="foo" class="test"><div id="bar">main title</div><div id="bar1">world</div><div>sub title</div></div>');
    })
})

describe('Hooks', () => {
    it('should support useState', async() => {
        const container = document.createElement('div');
        const globalObject = {};

        function App(props) {
            const [count, setCount] = AReact.useState(100);
            globalObject.count = count;
            globalObject.setCount = setCount;

            return (
                <div>{count}</div>
            )
        }
        
        const element = (<App />);
        const root = AReact.createRoot(container);
        await AReact.act(() => {
            root.render(element);
        })
        await AReact.act(() => {
            globalObject.setCount((count) => count + 1);
        })
        await AReact.act(() => {
            globalObject.setCount(globalObject.count + 1);
        })
        console.log('globalObject', globalObject)
        expect(globalObject.count).toBe(102);
    })
    it('should support useReducer', async() => {
        const container = document.createElement('div');
        const globalObject = {};
        function reducer(state, action) {
            switch(action.type) {
                case 'add': return state + 1;
                case 'sub': return state - 1;
            }
        }

        function App(props) {
            const [count, dispatch] = AReact.useReducer(reducer, 100);
            globalObject.count = count;
            globalObject.dispatch = dispatch;

            return (
                <div>{count}</div>
            )
        }
        
        const element = (<App />);
        const root = AReact.createRoot(container);
        await AReact.act(() => {
            root.render(element);
        })
        await AReact.act(() => {
            globalObject.dispatch({ type: 'add' });
            globalObject.dispatch({ type: 'add' });
        })
        // await AReact.act(() => {
        //     globalObject.dispatch(globalObject.count + 1);
        // })
        console.log('globalObject', globalObject)
        expect(globalObject.count).toBe(102);
    })
})