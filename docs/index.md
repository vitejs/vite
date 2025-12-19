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
<TrustedBy :logos="['openai', 'shopify', 'framer', 'linear', 'mercedes']" />
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
 <Footer
    heading="Start building with Vite"
    subheading="Prepare for a development environment that can finally keep pace with the speed of your mind."
    button-text="Get Started"
    button-link="/guide/"
  />
