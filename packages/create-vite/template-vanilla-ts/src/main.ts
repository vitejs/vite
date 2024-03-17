import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

const getElement = (id: string) => document.getElementById(id);

(<HTMLImageElement>getElement('typescriptLogo')).src = typescriptLogo;
(<HTMLImageElement>getElement('viteLogo')).src = viteLogo;
setupCounter(<HTMLButtonElement>getElement('counter'));
