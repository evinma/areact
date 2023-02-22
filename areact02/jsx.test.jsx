import { describe, it, expect } from "vitest";
import AReact from './AReact';

describe('areact jsx with props', () => {
    it('should render jsx', () => {
        const container = document.createElement('div');
        const element = (
            <div id="foo" className="test">
                <div id="bar">hello</div>
                <div id="bar1">world</div>
            </div>
        )
        console.log(JSON.stringify(element))
        const root = AReact.createRoot(container);
        root.render(element);

        console.log(container.innerHTML)

        expect(container.innerHTML).toBe('<div id="foo" class="test"><div id="bar">hello</div><div id="bar1">world</div></div>');
    })
})