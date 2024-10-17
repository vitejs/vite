import { CommonModule } from '@angular/common'
import { Component, signal } from '@angular/core'

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div class="root">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="./vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://angular.dev" target="_blank">
          <img src="/angular.svg" class="logo angular" alt="Angular logo" />
        </a>
      </div>
      <h1>Vite + Angular</h1>
      <div class="card">
        <button (click)="increment()">count is {{ count() }}</button>
        <p>Edit <code>src/app.component.ts</code> and save to test HMR</p>
      </div>
      <p class="read-the-docs">
        Click on the Vite and Angular logos to learn more
      </p>
    </div>
  `,
  styles: `
    .root {
      max-width: 1280px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }

    .logo {
      height: 6em;
      padding: 1.5em;
      will-change: filter;
      transition: filter 300ms;
    }
    .logo:hover {
      filter: drop-shadow(0 0 2em #646cffaa);
    }
    .logo.angular:hover {
      filter: drop-shadow(0 0 2em #f52e5eaa);
    }

    @keyframes logo-spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: no-preference) {
      a:nth-of-type(2) .logo {
        animation: logo-spin infinite 20s linear;
      }
    }

    .card {
      padding: 2em;
    }

    .read-the-docs {
      color: #888;
    }
  `,
  imports: [CommonModule],
})
export class AppComponent {
  count = signal(0)

  increment() {
    this.count.update((value) => value + 1)
  }
}
