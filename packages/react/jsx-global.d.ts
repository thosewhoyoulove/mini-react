import { Fragment, type FC, type VNode } from './src/core.js';

declare global {
  namespace JSX {
    interface Element extends VNode {}
    interface IntrinsicElements {
      [elemName: string]: Record<string, unknown>;
    }
    type ElementType = keyof IntrinsicElements | FC | typeof Fragment;
  }
}

export {};
