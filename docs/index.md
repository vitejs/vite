---
title: Vite
titleTemplate: Next Generation Frontend Tooling
layout: home
theme: dark
---

<script setup>
import { sponsors } from './_data/sponsors.js'
</script>

<Hero/>
<TrustedBy />
<HeadingSection
    heading="Redefining developer experience"
    subheading="Vite makes web development simple again"
  />
<ViteFeaturePanel1 />
<ViteFeaturePanel2 />
<ViteFeaturePanel3 />
<ViteFeaturePanel4 />
<HeadingSection
heading="A shared foundation to build upon"
/>
<ViteFeatureGrid />
<HeadingSection
heading="Powering your favorite frameworks and tools"
/>
<ViteFrameworks />
<ViteCommunity />
<ViteSponsors :sponsors="sponsors" />
<Spacer />
<Footer/>
