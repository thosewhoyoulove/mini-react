import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const reactPkg = path.resolve(__dirname, 'packages/react/index.ts');
const jsxRuntime = path.resolve(__dirname, 'packages/react/jsx-runtime.ts');
const reactDomClient = path.resolve(__dirname, 'packages/react-dom/client.ts');
const reactDomIndex = path.resolve(__dirname, 'packages/react-dom/index.ts');

export default defineConfig({
  resolve: {
    alias: [
      { find: 'react/jsx-runtime', replacement: jsxRuntime },
      { find: 'react/jsx-dev-runtime', replacement: jsxRuntime },
      /** 若 tsconfig 仍使用 jsxImportSource: "mini-react"，与 Vite 解析保持一致 */
      { find: 'mini-react/jsx-runtime', replacement: jsxRuntime },
      { find: 'mini-react/jsx-dev-runtime', replacement: jsxRuntime },
      { find: 'react-dom/client', replacement: reactDomClient },
      { find: /^react-dom$/, replacement: reactDomIndex },
      { find: /^react$/, replacement: reactPkg },
    ],
  },
});
