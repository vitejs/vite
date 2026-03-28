import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    if (typeof window !== 'undefined') {
      const updateAriaLabels = () => {
        const buttons = document.querySelectorAll('button.copy:not([aria-label])');
        buttons.forEach(btn => {
          const label = btn.getAttribute('title') || 'Copy code';
          btn.setAttribute('aria-label', label);
        });
      };

      // Run on initial load and observe DOM changes for dynamic code blocks
      window.addEventListener('DOMContentLoaded', updateAriaLabels);
      const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => updateAriaLabels());
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
}