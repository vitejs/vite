<script>
  let count = 0
  const increment = () => {
    count += 1
  }
</script>

<button on:click={increment}>
  count is {count}
</button>

<style>
  button {
    border: 0;
    border-radius: 4px;
    padding: 0.5em 1em;
    outline: 1px solid #8888;
    font-size: 1em;
    font-family: inherit;
    background-color: transparent;
  }
  
  button:hover {
    outline-color: #888;
  }
  button:focus,
  button:focus-visible {
    outline: 1px dotted;
    outline: 4px auto -webkit-focus-ring-color;
  }
</style>
