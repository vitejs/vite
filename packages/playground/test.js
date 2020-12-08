export function hi() {
  fetch('/api/todos/1')
    .then((res) => res.json())
    .then((data) => {
      console.log(data)
    })
}

hi()
