import { useUnit } from 'effector-react';
import viteLogo from '/vite.svg';
import reactLogo from './assets/react.svg';
import effectorLogo from './assets/effector.png'
import './application.css';
import { $counter, buttonClicked } from './model';

export function App() {
  const [counter, handleClick] = useUnit([$counter, buttonClicked]);

  return (
    <div className="App">
      <div>
        <a href="https://effector.dev" target="_blank">
          <img
            src={effectorLogo}
            className="logo effector"
            alt="Effector logo"
          />
        </a>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://reactjs.org" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Effector + Vite + React</h1>
      <div className="card">
        <button onClick={handleClick}>count is {counter}</button>
        <p>
          Edit <code>src/application.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Effector, Vite, and React logos to learn more
      </p>
    </div>
  );
}
