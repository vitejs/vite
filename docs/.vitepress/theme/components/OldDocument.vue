<template>
  <div class="old-document">
    <p>
      This documentation covers Vite 5 <strong>(old version)</strong>. For the
      latest version, see
      <a href="https://vite.dev" class="new-document-link">https://vite.dev</a>.
    </p>
  </div>
</template>

<style>
.old-document {
  position: fixed;
  display: flex;
  height: var(--vp-layout-top-height);
  width: 100%;
  padding: 4px 32px;
  justify-content: center;
  align-items: center;
  color: var(--vp-c-text-1);
  background: var(--vp-c-brand-lightest);
  z-index: var(--vp-z-index-layout-top);

  .new-document-link {
    text-decoration: underline;
    color: var(--vp-c-text-1);
    &:hover {
      color: var(--vp-c-text-2);
    }
  }
}
.dark {
  .old-document {
    background: var(--vp-c-brand-darker);
  }
}
</style>
