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
let currentHookFiber = null;
let currentHookIndex = 0;

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

    if (!workInProgress && workInProgressRoot.current.alternate) {
        workInProgressRoot.current = workInProgressRoot.current.alternate;
        workInProgressRoot.current.alternate = null;
    }
}
function performUnitOfWork(fiber) {
    const isFunctionCompontent = fiber.type instanceof Function;
    if (isFunctionCompontent) {
        currentHookFiber = fiber;
        currentHookFiber.memorizedState = [];
        currentHookIndex = 0;

        fiber.props.children = [fiber.type(fiber.props)];
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
    let oldFiber = fiber.alternate?.child;
    fiber.props.children?.forEach((ele, index) => {
        let newFiber;
        // 没值说明是mount阶段
        if (!oldFiber) {
            newFiber = {
                type: ele.type,
                stateNode: null,
                props: ele.props,
                return: fiber,
                alternate: null,
                child: null,
            }
        } else { // update 阶段
            newFiber = {
                type: ele.type,
                stateNode: oldFiber.stateNode,
                props: ele.props,
                return: fiber,
                // 指上上次版本的fiber
                alternate: oldFiber,
                child: null,
            }

             // 转移下一个指针
            oldFiber = oldFiber.sibiling;
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
function useState(initialState) {
    const oldHook = currentHookFiber.alternate?.memorizedState?.[currentHookIndex];
    console.log('oldHook', oldHook)

    const hook = {
        state: oldHook ? oldHook.state: initialState,
        queue: [],
        dispatch: oldHook ? oldHook.dispatch : null,
    }

    const actions = oldHook ? oldHook.queue : [];
    console.log('actions', actions)

    actions.forEach(action => {
        hook.state = typeof action === 'function' ? action(hook.state) : action;
    })
    // 保证setState函数不会每次都新建
    const setState = hook.dispatch ? hook.dispatch : (action) => {
        hook.queue.push(action)
        // 触发 rerender

        workInProgressRoot.current.alternate = {
            stateNode: workInProgressRoot.current.containerInfo,
            props: workInProgressRoot.current.props,
            alternate: workInProgressRoot.current, // 交换alternate
        }
        workInProgress = workInProgressRoot.current.alternate;
        window.requestIdleCallback(workLoop)
    }
    currentHookFiber.memorizedState.push(hook);
    currentHookIndex++;

    return [hook.state, setState];
}
function useReducer(reducer, initialState) {
    const [state, setState] = useState(initialState);
    function dispatch(action) {
        setState(state => reducer(state, action))
    }
    return [state, dispatch]
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
export default { createElement, createRoot, act, useState, useReducer };