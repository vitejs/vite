---
title: Acknowledgements
description: Vite is built upon the shoulders of giants. Thank you to all the projects and contributors that make Vite possible.
---

<script setup>
import { computed } from 'vue'
import { data } from './_data/acknowledgements.data'
import { useSponsor, voidZero } from './.vitepress/theme/composables/sponsor'
import VPSponsors from '@components/vitepress-default/VPSponsors.vue'

const { data: sponsorData } = useSponsor()

const allSponsors = computed(() => {
  if (!sponsorData.value) return []
  return [
    {
      tier: 'Brought to you by',
      size: 'big',
      items: [voidZero],
    },
    ...sponsorData.value,
  ]
})

function npmUrl(name) {
  return `https://www.npmjs.com/package/${name}`
}
</script>

# Acknowledgements

Vite is built upon the shoulders of giants. We would like to express our gratitude to all the projects, contributors, and sponsors that make Vite possible.

## Contributors

Vite is developed by an international team of contributors. See the [Team page](/team) to meet the core team members.

We also thank all the [contributors on GitHub](https://github.com/vitejs/vite/graphs/contributors) who have helped improve Vite through code contributions, bug reports, documentation, and documentation translation.

## Sponsors

Vite's development is supported by generous sponsors. You can support Vite through [GitHub Sponsors](https://github.com/sponsors/vitejs) or [Open Collective](https://opencollective.com/vite).

<div class="sponsors-container">
  <VPSponsors :data="allSponsors" />
</div>

## Dependencies

Vite depends on these amazing open source projects:

### Notable Dependencies

<div class="deps-list notable">
  <div v-for="dep in data.notableDependencies" :key="dep.name" class="dep-item">
    <div class="dep-header">
      <a :href="npmUrl(dep.name)" target="_blank" rel="noopener"><code>{{ dep.name }}</code></a>
      <span class="dep-links">
        <a v-if="dep.repository" :href="dep.repository" target="_blank" rel="noopener" class="dep-link">Repo</a>
        <a v-if="dep.funding" :href="dep.funding" target="_blank" rel="noopener" class="dep-link sponsor">Sponsor</a>
      </span>
    </div>
    <p v-if="dep.author" class="dep-author">
      by <a v-if="dep.authorUrl" :href="dep.authorUrl" target="_blank" rel="noopener">{{ dep.author }}</a><template v-else>{{ dep.author }}</template>
    </p>
    <p v-if="dep.description">{{ dep.description }}</p>
  </div>
</div>

### Bundled Dependency Authors

<table class="authors-table">
  <thead>
    <tr>
      <th>Author</th>
      <th>Packages</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="author in data.authors" :key="author.name">
      <td>
        <a v-if="author.url" :href="author.url" target="_blank" rel="noopener">{{ author.name }}</a>
        <template v-else>{{ author.name }}</template>
        <a v-if="author.funding" :href="author.funding" target="_blank" rel="noopener" class="sponsor-link">Sponsor</a>
      </td>
      <td>
        <template v-for="(pkg, index) in author.packages" :key="pkg.name">
          <span class="pkg-item"><a :href="npmUrl(pkg.name)" target="_blank" rel="noopener"><code>{{ pkg.name }}</code></a><a v-if="pkg.funding" :href="pkg.funding" target="_blank" rel="noopener" class="sponsor-link">Sponsor</a></span><template v-if="index < author.packages.length - 1">, </template>
        </template>
      </td>
    </tr>
  </tbody>
</table>

::: tip For package authors
This section is automatically generated from the `author` and `funding` fields in each package's `package.json`. If you'd like to update how your package appears here, you can update these fields in your package.
:::

## Development Tools

Vite's development workflow is powered by these tools:

<div class="deps-list notable">
  <div v-for="dep in data.devTools" :key="dep.name" class="dep-item">
    <div class="dep-header">
      <a :href="npmUrl(dep.name)" target="_blank" rel="noopener"><code>{{ dep.name }}</code></a>
      <span class="dep-links">
        <a v-if="dep.repository" :href="dep.repository" target="_blank" rel="noopener" class="dep-link">Repo</a>
        <a v-if="dep.funding" :href="dep.funding" target="_blank" rel="noopener" class="dep-link sponsor">Sponsor</a>
      </span>
    </div>
    <p v-if="dep.author" class="dep-author">
      by <a v-if="dep.authorUrl" :href="dep.authorUrl" target="_blank" rel="noopener">{{ dep.author }}</a><template v-else>{{ dep.author }}</template>
    </p>
    <p v-if="dep.description">{{ dep.description }}</p>
  </div>
</div>

## Past Notable Dependencies

We also thank the maintainers of these projects that Vite used in previous versions:

<table>
  <thead>
    <tr>
      <th>Package</th>
      <th>Description</th>
      <th>Links</th>
    </tr>
  </thead>
  <tbody>
    <tr v-for="dep in data.pastNotableDependencies" :key="dep.name">
      <td><a :href="npmUrl(dep.name)" target="_blank" rel="noopener"><code>{{ dep.name }}</code></a></td>
      <td>{{ dep.description }}</td>
      <td><a :href="dep.repository" target="_blank" rel="noopener">Repo</a></td>
    </tr>
  </tbody>
</table>

<style scoped>
.deps-list {
  display: grid;
  gap: 1rem;
  margin: 1rem 0;
}

.deps-list.notable {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

.dep-item {
  padding: 1rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.dep-item .dep-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.dep-item a {
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.dep-item a:hover {
  text-decoration: underline;
}

.dep-item .dep-links {
  display: flex;
  gap: 0.5rem;
}

.dep-item .dep-link {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: var(--vp-c-default-soft);
}

.dep-item .dep-author {
  margin: 0.25rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.8rem;
}

.dep-item .dep-link.sponsor {
  background: var(--vp-c-brand-soft);
}

.dep-item p {
  margin: 0.5rem 0 0;
  color: var(--vp-c-text-2);
  font-size: 0.875rem;
}

.authors-table .sponsor-link {
  margin-left: 0.5rem;
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  border-radius: 4px;
  background: var(--vp-c-brand-soft);
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.authors-table .sponsor-link:hover {
  text-decoration: underline;
}
</style>
