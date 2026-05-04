import { createElement, Fragment } from './src/core.js';

export { Fragment };

export function jsx(
  type: Parameters<typeof createElement>[0],
  props: Record<string, unknown> | null,
  key?: string,
): ReturnType<typeof createElement> {
  const p = props ? { ...props } : {};
  if (key !== undefined) p['key'] = key;
  return createElement(type, p);
}

export const jsxs = jsx;

/** 开发模式下 TS/react-jsxdev 使用 */
export function jsxDEV(
  type: Parameters<typeof createElement>[0],
  props: Record<string, unknown> | null,
  key: string | undefined,
  _isStaticChildren: boolean,
  _source: unknown,
  _self: unknown,
): ReturnType<typeof createElement> {
  return jsx(type, props, key);
}
