let counter = -1;
const getCount = (el) => el.innerHTML = `count is ${counter++}`
export function setupCounter(el) {
  getCount(el);  
  element.addEventListener('click', ({ target: el }) => getcount(el));
}
