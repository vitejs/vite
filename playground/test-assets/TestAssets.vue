<template>
  <h2>Static Asset Handling</h2>
  <p>
    Fonts should be italic if font asset reference from CSS works.
  </p>
  <p class="asset-import">
    Path for assets import from js: <code>{{ filepath }}</code>
  </p>
  <p>
    Relative asset reference in template:
    <img class="relative-import" src="./nested/testAssets.png" data-src="./nested/testAssets.png" style="width: 30px;" />
  </p>
  <p>
    Absolute asset reference in template:
    <img src="/icon.png" style="width: 30px;" />
  </p>
  <div class="css-bg">
    <span style="background: #fff;">CSS background</span>
  </div>
  <div class="css-import-bg">
    <span style="background: #fff;">CSS background with relative paths</span>
  </div>
  <div class="css-bg-data-uri">
    <span style="background: #fff;">CSS background with Data URI</span>
  </div>
</template>

<script>
import './testAssets.css'
import filepath from './nested/testAssets.png'

export default {
  data() {
    return {
      filepath
    }
  }
}
</script>

<style>
@font-face {
  font-family: 'Inter';
  font-style: italic;
  font-weight: 400;
  font-display: swap;
  src: url('../fonts/Inter-Italic.woff2?#iefix') format('woff2'),
    url('/fonts/Inter-Italic.woff') format('woff');
}

body {
  font-family: 'Inter';
}
.css-bg {
  background: url(/icon.png);
  background-size: 10px;
}
.css-bg-data-uri {
  background: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADwAAAA0CAYAAADWr1sfAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyNpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6NTAyNkI1RkE4N0VCMTFFQUFBQzJENzUzNDFGRjc1N0UiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6NTAyNkI1Rjk4N0VCMTFFQUFBQzJENzUzNDFGRjc1N0UiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QTc3NzA2Q0Y4N0FCMTFFM0I3MERFRTAzNzcwNkMxMjMiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QTc3NzA2RDA4N0FCMTFFM0I3MERFRTAzNzcwNkMxMjMiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz6nwnGxAAAJtklEQVR42txZ6W9c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);
  background-size: 10px;
}
</style>
