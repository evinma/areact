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