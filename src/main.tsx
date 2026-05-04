import { Fragment, useState, type FC } from 'react';
import { createRoot } from 'react-dom/client';

const Counter: FC = () => {
  const [n, setN] = useState(0);
  return (
    <Fragment>
      <p className="hint">点击下方按钮验证 Fiber reconcile 与 useState</p>
      <button type="button" onClick={() => setN((x) => x + 1)}>
        计数：{n}
      </button>
    </Fragment>
  );
};

const App: FC = () => (
  <main style={{ fontFamily: 'system-ui', padding: '2rem', maxWidth: 520 }}>
    <h1 style={{ marginTop: 0 }}>mini-react</h1>
    <Counter />
  </main>
);

const root = document.getElementById('root');
if (!root) throw new Error('#root 缺失');

createRoot(root).render(<App />);
