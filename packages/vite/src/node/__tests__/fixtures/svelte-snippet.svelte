<script module>
  export { mySnippet };
</script>

<div>
  {#snippet mySnippet()}
    <p>Hello from snippet!</p>
  {/snippet}
</div>