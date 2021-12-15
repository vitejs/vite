document
  .querySelector('.a')
  .addEventListener('click', () => import('./dynamic-a'))
document
  .querySelector('.b')
  .addEventListener('click', () => import('./dynamic-b'))
