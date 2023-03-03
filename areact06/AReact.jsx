import "../requestIdleCallbackPolyfill";

function createElement(type, props, ...children) {
  return {
    type,
    props: {
      ...props,
      children: children.flat().map((ele) => {
        return typeof ele !== "object" ? createTextElement(ele) : ele;
      }),
    },
  };
}

function createTextElement(ele) {
  return {
    type: "hostText",
    props: {
      nodeValue: ele,
    },
    children: [],
  };
}
const isEvent = (k) => k.startsWith("on");
const isProperty = (k) => k !== "children" && !isEvent(k);
const isGone = (prevProps, nextProps) => (key) => !(key in nextProps) && (key in prevProps);
const isChanged = (prevProps, nextProps) => (key) => (key in prevProps) && (key in nextProps) && prevProps[key] !== nextProps[key];
const isNew = (prevProps, nextProps) => (key) => !(key in prevProps) && (key in nextProps);

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
    };
    // this.container = container;
  }
  render(element) {
    this._internalRoot.current = {
      alternate: {
        stateNode: this._internalRoot.containerInfo,
        props: {
          children: [element],
        },
      },
    };
    workInProgressRoot = this._internalRoot;
    workInProgressRoot.deletions = [];
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
function updateDom(stateNode, prevProps, nextProps) {
  // 删除 删除和变化的 event
  Object.keys(prevProps)
    .filter(isEvent)
    .filter(key => isGone(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key))
    .forEach((key) => {
      const eventName = key.toLocaleLowerCase().substring(2);

      stateNode.removeEventListener(eventName, prevProps[key]);
    });
  // 删除 去掉的 props
  Object.keys(prevProps)
    .filter(isProperty)
    .filter(isGone(prevProps, nextProps))
    .forEach((key) => {
      stateNode[key] = '';
    });
  // 添加 新增和变化的属性
  Object.keys(nextProps)
    .filter(isProperty)
    .filter((key) => isNew(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key))
    .forEach((key) => {
      stateNode[key] = nextProps[key];
    });
  // 绑定 新增和变化的 event
  Object.keys(nextProps)
    .filter(isEvent)
    .filter(key => isNew(prevProps, nextProps)(key) || isChanged(prevProps, nextProps)(key))
    .forEach((key) => {
      const eventName = key.toLocaleLowerCase().substring(2);

      stateNode.addEventListener(eventName, nextProps[key]);
    });
}
// 插入dom
function commitWork(fiber) {
  if (!fiber) return;
  // 插入当前的dom到parent
  let domParentFiber;
  if (fiber.return) {
    domParentFiber = fiber.return;
    while (!domParentFiber.stateNode) {
      domParentFiber = domParentFiber.return;
    }
    // domParentFiber.stateNode.appendChild(fiber.stateNode);
  }

  if (fiber.effectTag === "PLACEMENT" && fiber.stateNode) {
    updateDom(fiber.stateNode, {}, fiber.props);
    // 插入dom
    domParentFiber.stateNode.appendChild(fiber.stateNode);
  } else if (fiber.effectTag === 'UPDATE') {
    updateDom(fiber.stateNode, fiber.alternate.props, fiber.props)
  } else if (fiber.effectTag === 'DELETION') {
    deleteDom(fiber, domParentFiber);
  }

  commitWork(fiber.child);
  commitWork(fiber.sibiling);
}

function deleteDom(fiber, domParentFiber) {
  if (fiber.stateNode) {
    
    // try {
      console.log('=================')
      console.log(fiber.type)
      console.log(fiber.stateNode.innerHTML)
      console.log(domParentFiber.type)
      console.log(domParentFiber.stateNode.innerHTML)
      if (domParentFiber.stateNode.contains(fiber.stateNode)) {
        domParentFiber.stateNode.removeChild(fiber.stateNode);
      }
    // } catch (error) {
    //   // console.log('=================')
    //   // console.log(fiber.type)
    //   // console.log(fiber.stateNode.innerHTML)
    //   // console.log(domParentFiber.type)
    //   // console.log(domParentFiber.stateNode.innerHTML)
    // }
    
  } else {
    deleteDom(fiber.child, domParentFiber.stateNode);
  }
}
function workLoop() {
  while (workInProgress) {
    workInProgress = performUnitOfWork(workInProgress);
  }

  // fiber node 处理完毕
  if (!workInProgress && workInProgressRoot.current.alternate) {
    commitRoot();
  }
}
function commitRoot() {
  console.log('workInProgressRoot.deletions.length', workInProgressRoot.deletions.length)
  let fiber = workInProgressRoot.deletions.pop()
  while(fiber) {
    commitWork(fiber)
    fiber = workInProgressRoot.deletions.pop()
  }
  commitWork(workInProgressRoot.current.alternate.child);

  // 切换指针
  workInProgressRoot.current = workInProgressRoot.current.alternate;
  workInProgressRoot.current.alternate = null;
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
      fiber.stateNode =
        fiber.type === "hostText"
          ? document.createTextNode("")
          : document.createElement(fiber.type);
    }
  }
  reconclieChildren(fiber, fiber.props.children);

  // 返回下一个要处理的fiber
  return getNextFiber(fiber);
}
function reconclieChildren(fiber, children) {
  // // 遍历 children，比较当前fiber和oldFiber，然后在 fiber上添加effectTag
  // Object.keys(fiber.props)
  //   .filter(isProperty)
  //   .forEach((key) => {
  //     fiber.stateNode[key] = fiber.props[key];
  //   });
  // Object.keys(fiber.props)
  //   .filter(isEvent)
  //   .forEach((key) => {
  //     const eventName = key.toLocaleLowerCase().substring(2);
  //     fiber.stateNode.addEventListener(eventName, fiber.props[key]);
  //   });

  // 初始化children fiber
  let prevSinbling = null;
  let oldFiber = fiber.alternate?.child;
  // oldFiber [1, 2, 3] newFiber [1, 2]
  let index = 0;
  while (index < fiber.props?.children?.length || oldFiber) {
    let child = fiber.props.children[index];

    let newFiber = null;
    let sameType = oldFiber && child && child.type === oldFiber.type;

    if (child && !sameType) {
      // mount/placement
      newFiber = {
        type: child.type,
        stateNode: null,
        props: child.props,
        return: fiber,
        alternate: null,
        child: null,
        effectTag: "PLACEMENT",
      };
    } else if (sameType) {
      // update
      newFiber = {
        type: child.type,
        stateNode: oldFiber.stateNode,
        props: child.props,
        return: fiber,
        // 指上上次版本的fiber
        alternate: oldFiber,
        child: null,
        effectTag: "UPDATE",
      };

    } else if (!sameType && oldFiber) {
      // delete
      oldFiber.effectTag = 'DELETION';
      workInProgressRoot.deletions.push(oldFiber);
    }

    // 转移下一个指针
    if (oldFiber) {
      oldFiber = oldFiber.sibiling;
    }

    if (index === 0) {
      fiber.child = newFiber;
    } else {
      prevSinbling && (prevSinbling.sibiling = newFiber);
    }
    prevSinbling = newFiber;
    index++;
  }
}

function getNextFiber(fiber) {
  if (fiber.child) {
    return fiber.child;
  }

  let nextFiber = fiber;
  while (nextFiber) {
    if (nextFiber.sibiling) {
      return nextFiber.sibiling;
    } else {
      nextFiber = nextFiber.return;
    }
  }
  return null;
}
function createRoot(container) {
  return new AReactDomRoot(container);
}
function useState(initialState) {
  const oldHook =
    currentHookFiber.alternate?.memorizedState?.[currentHookIndex];
  console.log("oldHook", oldHook);

  const hook = {
    state: oldHook ? oldHook.state : initialState,
    queue: [],
    dispatch: oldHook ? oldHook.dispatch : null,
  };

  const actions = oldHook ? oldHook.queue : [];
  console.log("actions", actions);

  actions.forEach((action) => {
    hook.state = typeof action === "function" ? action(hook.state) : action;
  });
  // 保证setState函数不会每次都新建
  const setState = hook.dispatch
    ? hook.dispatch
    : (action) => {
        hook.queue.push(action);
        // 触发 rerender

        workInProgressRoot.current.alternate = {
          stateNode: workInProgressRoot.containerInfo,
          props: workInProgressRoot.current.props,
          alternate: workInProgressRoot.current, // 交换alternate
        };
        workInProgress = workInProgressRoot.current.alternate;
        window.requestIdleCallback(workLoop);
      };
  currentHookFiber.memorizedState.push(hook);
  currentHookIndex++;

  return [hook.state, setState];
}
function useReducer(reducer, initialState) {
  const [state, setState] = useState(initialState);
  function dispatch(action) {
    setState((state) => reducer(state, action));
  }
  return [state, dispatch];
}
function act(callback) {
  // 执行渲染
  callback();

  // 检测 workInProgress
  return new Promise((resolve) => {
    function loop() {
      if (workInProgress) {
        window.requestIdleCallback(loop);
      } else {
        resolve();
      }
    }
    loop();
  });
}
export default { createElement, createRoot, act, useState, useReducer };
