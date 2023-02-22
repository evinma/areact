import '../requestIdleCallbackPolyfill';

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children:  children.flat().map(ele => {
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

let workInProgress = null;
let workInProgressRoot = null;

class AReactDomRoot {
    _internalRoot = null;

    constructor(container) {
        this._internalRoot = {
            current: null,
            containerInfo: container,
        }
        // this.container = container;

    }
    render(element) {
        this._internalRoot.current = {
            alternate: {
                stateNode: this._internalRoot.containerInfo,
                props: {
                    children: [element]
                }
            }
        }
        workInProgressRoot = this._internalRoot;
        workInProgress = workInProgressRoot.current.alternate;
        window.requestIdleCallback(workLoop);
    }
    // renderImpl(element, parent) {
    //     const dom = element.type === 'hostText' ? document.createTextNode('') : document.createElement(element.type);
    //     Object.keys(element.props).filter(isProperty).forEach(key => {
    //         dom[key] = element.props[key];
    //     })
    //     element.props.children?.forEach(ele => {
    //         this.renderImpl(ele, dom);
    //     })
    //     parent.appendChild(dom);
    // }
}
function workLoop() {
    while(workInProgress) {
        workInProgress = performUnitOfWork(workInProgress);
    }
}
function performUnitOfWork(fiber) {
    const isFunctionCompontent = fiber.type instanceof Function;
    if (isFunctionCompontent) {
        fiber.props.children = [fiber.type(fiber.props)]
    } else {
        // 处理当前fiber 节点；创建dom 设置props; 插入当前的dom到parent
        if (!fiber.stateNode) {
            fiber.stateNode = fiber.type === 'hostText' ? document.createTextNode('') : document.createElement(fiber.type);
            Object
                .keys(fiber.props)
                .filter(isProperty).forEach(key => {
                    fiber.stateNode[key] = fiber.props[key];
                })
        }
        // 插入当前的dom到parent
        if (fiber.return) {
            let domParentFiber = fiber.return;
            while (!domParentFiber.stateNode) {
                domParentFiber = domParentFiber.return;
            }
            domParentFiber.stateNode.appendChild(fiber.stateNode);
        }
    }
    
    // 初始化children fiber
    let prevSinbling = null;
    fiber.props.children?.forEach((ele, index) => {
        const newFiber = {
            type: ele.type,
            stateNode: null,
            props: ele.props,
            return: fiber,
        }
        if (index === 0) {
            fiber.child = newFiber;
        } else {
            prevSinbling.sibiling = newFiber;
        }
        prevSinbling = newFiber;
    })
    
    // 返回下一个要处理的fiber
    return getNextFiber(fiber);
}

function getNextFiber(fiber) {
    if (fiber.child) {
        return fiber.child;
    }

    let nextFiber = fiber;
    while(nextFiber) {
        if (nextFiber.sibiling) {
            return nextFiber.sibiling;
        } else {
            nextFiber = nextFiber.return
        }
    }
    return null;
}
function createRoot(container) {
    return new AReactDomRoot(container)
}
function act(callback) {
    // 执行渲染
    callback();

    // 检测 workInProgress
    return new Promise((resolve) => {
        function loop() {
            if (workInProgress) {
                window.requestIdleCallback(loop)
            } else {
                resolve()
            }
        }
        loop();
    })
}
export default { createElement, createRoot, act };