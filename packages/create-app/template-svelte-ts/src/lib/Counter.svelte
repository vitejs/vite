<script lang="ts">
  import { getStore } from './hmr-stores'
  export let id: string

  const count = getStore(id, 0)
  const increment = () => {
    $count += 1
  }
</script>

<button {id} on:click={increment}>
  Clicks: {$count}
</button>

<style>
  button {
    font-family: inherit;
    font-size: inherit;
    padding: 1em 2em;
    color: #ff3e00;
    background-color: rgba(255, 62, 0, 0.1);
    border-radius: 2em;
    border: 2px solid rgba(255, 62, 0, 0);
    outline: none;
    width: 200px;
    font-variant-numeric: tabular-nums;
  }

  button:focus {
    border: 2px solid #ff3e00;
  }

  button:active {
    background-color: rgba(255, 62, 0, 0.2);
  }
</style>
