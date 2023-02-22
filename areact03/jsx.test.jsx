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