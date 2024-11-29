<template>
  <div class="old-document">
    <p>
      This documentation covers Vite 2 <strong>(old version)</strong>. For the
      latest version, see
      <a href="https://vite.dev" class="new-document-link">https://vite.dev</a>.
    </p>
  </div>
</template>

<style>
.old-document {
  position: fixed;
  top: 0;
  left: 0;
  display: flex;
  height: var(--vp-layout-top-height);
  width: 100%;
  padding: 4px 32px;
  justify-content: center;
  align-items: center;
  color: var(--c-text);
  background: var(--c-brand-lightest);
  z-index: calc(var(--z-index-navbar) + 1);

  .new-document-link {
    text-decoration: underline;
    color: var(--c-text);
    &:hover {
      color: var(--c-text-light);
    }
  }
}
</style>
