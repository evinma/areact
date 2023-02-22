function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children:  children.map(ele => {
                return typeof ele !== 'object' ? createTextElement(ele) : ele;
            }),
        }
    }
}

function createTextElement(ele) {
    return {
        type: 'hostText',
        props: {
            nodeValue: ele,
        },
        children: [],
    }
}
const isProperty = k => k !== 'children';

class AReactDomRoot {
    constructor(container) {
        this.container = container;

    }
    render(element) {
        // return 'hello';
        this.renderImpl(element, this.container);
        
    }
    renderImpl(element, parent) {
        const dom = element.type === 'hostText' ? document.createTextNode('') : document.createElement(element.type);
        Object.keys(element.props).filter(isProperty).forEach(key => {
            dom[key] = element.props[key];
        })
        element.props.children?.forEach(ele => {
            this.renderImpl(ele, dom);
        })
        parent.appendChild(dom);
    }
}
function createRoot(container) {
    return new AReactDomRoot(container)
}
export default { createElement, createRoot };