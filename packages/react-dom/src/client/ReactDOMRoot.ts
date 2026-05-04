import type { VNode } from '../../../react/src/core.js';
import { render as renderIntoContainer } from '../../../react/src/core.js';

/** 对齐 react-dom/client 的 createRoot（极简） */
export function createRoot(container: HTMLElement): {
  render(children: VNode): void;
} {
  return {
    render(children: VNode) {
      renderIntoContainer(children, container);
    },
  };
}
