<template>
  <div class="old-document">
    <span>
      This documentation covers Vite 7 <strong>(old version)</strong>. For the
      latest version, see
      <a href="https://vite.dev" class="new-document-link">https://vite.dev</a>.
    </span>
  </div>
</template>

<style>
:root {
  --vp-banner-height: 96px;
  --vp-layout-top-height: 96px;
  @media (min-width: 455px) {
    --vp-banner-height: 64px;
    --vp-layout-top-height: 64px;
  }
  @media (min-width: 960px) {
    --vp-banner-height: 32px;
    --vp-layout-top-height: 32px;
  }
}

.old-document {
  position: fixed;
  display: flex;
  height: var(--vp-banner-height);
  width: 100%;
  padding: 4px 32px;
  justify-content: center;
  align-items: center;
  color: var(--vp-c-text-1);
  background-image: linear-gradient(var(--vp-c-brand-soft));
  background-color: var(--vp-c-bg);
  z-index: 70;

  .new-document-link {
    color: var(--vp-c-brand-1);
    text-decoration: underline;
  }
}
.marketing-layout .old-document {
  position: static;
}
</style>
