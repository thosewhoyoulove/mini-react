/** Fiber reconcile、hooks；DOM 提交见 react-dom 对 render 的调用 */

/** 与任意真实 HTML 标签名不冲突的占位 type */
export const Fragment = 'mini.react.fragment' as const;

const TEXT_ELEMENT = 'TEXT_ELEMENT' as const;

export type VNodeChild = VNode | string | number | boolean | null | undefined;

export interface VNode {
  type: string | typeof TEXT_ELEMENT | typeof Fragment | FC;
  props: {
    nodeValue?: string;
    children: VNode[];
    [key: string]: unknown;
  };
}

export type FC<P extends Record<string, unknown> = Record<string, unknown>> = (
  props: P,
) => VNode | null;

type HostNode = HTMLElement | Text;

type FiberRootType = null | undefined;

interface Hook {
  state: unknown;
  queue: Array<unknown | ((prev: unknown) => unknown)>;
}

interface Fiber {
  /** 根 fiber 无 type */
  type?: VNode['type'] | FiberRootType;
  props: VNode['props'];
  dom?: HostNode | null;
  parent?: Fiber;
  child?: Fiber;
  sibling?: Fiber;
  alternate?: Fiber;
  effectTag?: 'PLACEMENT' | 'UPDATE' | 'DELETION';
  hooks?: Hook[];
}

let nextUnitOfWork: Fiber | null = null;
let wipRoot: Fiber | null = null;
let currentRoot: Fiber | null = null;
let deletions: Fiber[] = [];

let wipFiber: Fiber | null = null;
let hookIndex = 0;

function createTextVNode(text: string): VNode {
  return {
    type: TEXT_ELEMENT,
    props: { nodeValue: text, children: [] },
  };
}

function normalizeChild(child: VNodeChild): VNode | null {
  if (child == null || typeof child === 'boolean') return null;
  if (typeof child === 'object') return child;
  return createTextVNode(String(child));
}

function flattenChildren(children: VNodeChild[]): VNode[] {
  const out: VNode[] = [];
  const walk = (c: VNodeChild) => {
    if (c == null || typeof c === 'boolean') return;
    if (Array.isArray(c)) {
      c.forEach(walk);
      return;
    }
    const n = normalizeChild(c);
    if (n) out.push(n);
  };
  children.forEach(walk);
  return out;
}

export function createElement(
  type: VNode['type'],
  props: Record<string, unknown> | null,
  ...rawChildren: VNodeChild[]
): VNode {
  const p = props ? { ...props } : {};
  const propChildren = p['children'];
  const merged: VNodeChild[] = [];
  if (propChildren !== undefined) merged.push(propChildren as VNodeChild);
  merged.push(...rawChildren);
  const children = flattenChildren(merged);
  return { type, props: { ...p, children } };
}

function createDom(fiber: Fiber): HostNode {
  const dom =
    fiber.type === TEXT_ELEMENT
      ? document.createTextNode('')
      : document.createElement(fiber.type as string);

  updateDom(dom, { children: [] }, fiber.props);
  return dom;
}

const isEvent = (key: string) => key.startsWith('on');
const isProperty = (key: string) => key !== 'children' && !isEvent(key);
const isNew = (prev: VNode['props'], next: VNode['props'], key: string) => prev[key] !== next[key];
const isGone = (_prev: VNode['props'], next: VNode['props'], key: string) => !(key in next);

function getEventName(prop: string): string {
  return prop.slice(2).toLowerCase();
}

function updateDom(dom: HostNode, prevProps: VNode['props'], nextProps: VNode['props']) {
  Object.keys(prevProps)
    .filter(isEvent)
    .filter((key) => !(key in nextProps) || isNew(prevProps, nextProps, key))
    .forEach((key) => {
      dom.removeEventListener(getEventName(key), prevProps[key] as EventListener);
    });

  Object.keys(prevProps)
    .filter(isProperty)
    .filter((key) => isGone(prevProps, nextProps, key))
    .forEach((key) => {
      Reflect.set(dom, key, '');
    });

  Object.keys(nextProps)
    .filter(isProperty)
    .filter((key) => isNew(prevProps, nextProps, key))
    .forEach((key) => {
      Reflect.set(dom, key, nextProps[key]);
    });

  if (dom instanceof Text) {
    const nextVal = nextProps['nodeValue'];
    if (typeof nextVal === 'string' && nextVal !== prevProps['nodeValue']) {
      dom.nodeValue = nextVal;
    }
  }

  Object.keys(nextProps)
    .filter(isEvent)
    .filter((key) => isNew(prevProps, nextProps, key))
    .forEach((key) => {
      dom.addEventListener(getEventName(key), nextProps[key] as EventListener);
    });
}

function commitRoot() {
  deletions.forEach(commitWork);
  if (wipRoot?.child) commitWork(wipRoot.child);
  currentRoot = wipRoot;
  wipRoot = null;
}

function insertDom(fiber: Fiber, dom: HostNode) {
  let parentFiber = fiber.parent;
  while (parentFiber && !parentFiber.dom) {
    parentFiber = parentFiber.parent;
  }
  parentFiber?.dom?.appendChild(dom);
}

function commitWork(fiber?: Fiber) {
  if (!fiber) return;

  if (fiber.effectTag === 'PLACEMENT' && fiber.dom != null) {
    insertDom(fiber, fiber.dom);
  }

  if (fiber.effectTag === 'UPDATE' && fiber.dom != null && fiber.alternate) {
    updateDom(fiber.dom, fiber.alternate.props, fiber.props);
  }

  if (fiber.effectTag === 'DELETION') {
    commitDeletion(fiber);
    return;
  }

  commitWork(fiber.child);
  commitWork(fiber.sibling);
}

function commitDeletion(fiber: Fiber) {
  if (fiber.dom) {
    fiber.dom.parentNode?.removeChild(fiber.dom);
    return;
  }
  commitWork(fiber.child);
}

function reconcileChildren(wipFiber: Fiber, elements: VNode[]) {
  let index = 0;
  let oldFiber = wipFiber.alternate?.child;
  let prevSibling: Fiber | null = null;

  while (index < elements.length || oldFiber != null) {
    const element = elements[index];
    let newFiber: Fiber | null = null;

    const sameType = !!(oldFiber && element && element.type === oldFiber.type);

    if (oldFiber && element && sameType) {
      newFiber = {
        type: oldFiber.type,
        props: element.props,
        dom: oldFiber.dom,
        parent: wipFiber,
        alternate: oldFiber,
        effectTag: 'UPDATE',
      };
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        props: element.props,
        dom: null,
        parent: wipFiber,
        effectTag: 'PLACEMENT',
      };
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = 'DELETION';
      deletions.push(oldFiber);
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling ?? undefined;
    }

    if (index === 0) {
      wipFiber.child = newFiber ?? undefined;
    } else if (prevSibling && newFiber) {
      prevSibling.sibling = newFiber;
    }

    prevSibling = newFiber;
    index++;
  }
}

function updateFunctionComponent(fiber: Fiber) {
  wipFiber = fiber;
  hookIndex = 0;
  fiber.hooks = [];

  const fn = fiber.type as FC;
  const child = fn(fiber.props as Record<string, unknown>);
  reconcileChildren(fiber, child ? [child] : []);
}

function updateHostComponent(fiber: Fiber) {
  if (!fiber.dom) {
    fiber.dom = createDom(fiber);
  }
  reconcileChildren(fiber, fiber.props.children);
}

function performUnitOfWork(fiber: Fiber): Fiber | null {
  const isRoot = fiber.type == null || fiber.type === undefined;
  const isFragment = fiber.type === Fragment;

  if (isRoot || isFragment) {
    reconcileChildren(fiber, fiber.props.children);
  } else if (typeof fiber.type === 'function') {
    updateFunctionComponent(fiber);
  } else {
    updateHostComponent(fiber);
  }

  if (fiber.child) return fiber.child;

  let next: Fiber | undefined = fiber;
  while (next) {
    if (next.sibling) return next.sibling;
    next = next.parent;
  }
  return null;
}

function flushWork() {
  while (nextUnitOfWork) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
  }
  if (wipRoot) commitRoot();
}

/** react-dom/client 使用的挂载入口（对齐官方边界：渲染器侧导出） */
export function render(element: VNode, container: HTMLElement) {
  wipRoot = {
    dom: container,
    props: { children: [element] },
    alternate: currentRoot ?? undefined,
  };
  deletions = [];
  nextUnitOfWork = wipRoot;
  flushWork();
}

export type StateAction<T> = T | ((prev: T) => T);

export function useState<T>(initial: T): [T, (action: StateAction<T>) => void] {
  const fiber = wipFiber;
  if (!fiber) throw new Error('useState 只能在函数组件内调用');

  const oldHook = fiber.alternate?.hooks?.[hookIndex];

  const hook: Hook = {
    state: oldHook ? oldHook.state : initial,
    queue: [],
  };

  const actions = oldHook?.queue ?? [];
  actions.forEach((action) => {
    hook.state =
      typeof action === 'function' ? (action as (p: unknown) => unknown)(hook.state) : action;
  });

  const setState = (action: StateAction<T>) => {
    hook.queue.push(action as unknown);
    wipRoot = {
      dom: currentRoot!.dom!,
      props: currentRoot!.props,
      alternate: currentRoot!,
    };
    nextUnitOfWork = wipRoot;
    deletions = [];
    flushWork();
  };

  fiber.hooks!.push(hook);
  hookIndex++;
  return [hook.state as T, setState];
}
