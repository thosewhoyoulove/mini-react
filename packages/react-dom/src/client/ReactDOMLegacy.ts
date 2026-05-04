import type { VNode } from '../../../react/src/core.js';
import { render as renderIntoContainer } from '../../../react/src/core.js';

/** 对齐 react-dom 的 legacy render API */
export function render(element: VNode, container: Element): void {
  renderIntoContainer(element, container as HTMLElement);
}
