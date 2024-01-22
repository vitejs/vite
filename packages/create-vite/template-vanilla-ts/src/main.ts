import './style.css'
import typescriptLogo from './typescript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.ts'

const app = document.querySelector<HTMLDivElement>('#app');

if (app) {
  const wrapper = document.createElement('div');

  // Set up Vite link and logo
  const viteLink = document.createElement('a');
  viteLink.setAttribute('href', 'https://vitejs.dev');
  viteLink.setAttribute('target', '_blank');
  const viteLinkLogo = document.createElement('img');
  viteLinkLogo.setAttribute('src', viteLogo);
  viteLinkLogo.setAttribute('class', 'logo');
  viteLinkLogo.setAttribute('alt', 'Vite logo');
  viteLink.appendChild(viteLinkLogo);

  // Set up JavaScript link and logo
  const typescriptLink = document.createElement('a');
  typescriptLink.setAttribute('href', 'https://www.typescriptlang.org/');
  typescriptLink.setAttribute('target', '_blank');
  const tsLinkLogo = document.createElement('img');
  tsLinkLogo.setAttribute('src', typescriptLogo);
  tsLinkLogo.setAttribute('class', 'logo vanilla');
  tsLinkLogo.setAttribute('alt', 'TypeScript logo');
  typescriptLink.appendChild(tsLinkLogo);

  // Set up title
  const title = document.createElement('h1');
  title.textContent = 'Hello Vite!';

  // Set up card
  const card = document.createElement('div');
  card.setAttribute('class', 'card');
  const counterButton = document.createElement('button');
  counterButton.setAttribute('id', 'counter');
  card.appendChild(counterButton);

  // Set up docs
  const readTheDocs = document.createElement('p');
  readTheDocs.setAttribute('class', 'read-the-docs');
  readTheDocs.textContent = 'Click on the Vite logo to learn more';

  // Append all elements to wrapper, then the app
  wrapper.appendChild(viteLink);
  wrapper.appendChild(typescriptLink);
  wrapper.appendChild(title);
  wrapper.appendChild(card);
  wrapper.appendChild(readTheDocs);
  app.appendChild(wrapper);  

  setupCounter(counterButton)
}
