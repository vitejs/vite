<script lang="ts">
  let count: number = $state(0)
  const increment = () => {
    count += 1
  }
</script>

<button class="counter" onclick={increment}>
  Count is {count}
</button>
