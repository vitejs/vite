<script setup>
import SvgNode from '../hero-diagram/SvgNode.vue'
import { ref } from 'vue'

const position = ref(0.4)
</script>

<template>
  <div class="feature-card">
    <div class="feature__visualization">
      <!-- Left-side lines/nodes -->
      <svg
        class="left-lines"
        width="195"
        height="138"
        viewBox="0 0 195 138"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M195 31.5L89.8055 30.377C76.1575 30.377 62.535 29.076 49.0906 26.4886L-21 13"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 31.5L89.8055 30.377C76.1575 30.377 62.535 29.076 49.0906 26.4886L-21 13"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M195 50L69.295 47.754L-21 41.016"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 50L69.295 47.754L-21 41.016"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M195 68.5L-21 69.5642"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 68.5L-21 69.5642"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M195 87L69.2951 89.2463L-21 96.1614"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 87L69.2951 89.2463L-21 96.1614"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M195 105.5L89.8055 106.623C76.1575 106.623 62.535 107.924 49.0906 110.511L-21 124"
          stroke="url(#ob-linear-gradient-left)"
        />

        <SvgNode
          path="M195 105.5L89.8055 106.623C76.1575 106.623 62.535 107.924 49.0906 110.511L-21 124"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <defs>
          <linearGradient
            id="ob-linear-gradient-left"
            x1="-453.247"
            y1="167.386"
            x2="196.189"
            y2="125.855"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="white" stop-opacity="0" />
            <stop offset="0.7" stop-color="white" stop-opacity="0.2" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>

      <!-- Right-side lines/nodes -->
      <svg
        class="right-lines"
        width="203"
        height="113"
        viewBox="0 0 203 113"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 93.5L105.194 94.623C118.843 94.623 132.465 95.924 145.909 98.5114L216 112"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M0 93.5L105.194 94.623C118.843 94.623 132.465 95.924 145.909 98.5114L216 112"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M0 75L125.705 77.246L216 83.984"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M0 75L125.705 77.246L216 83.984"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M4.65162e-08 56.5L216 55.4358"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M4.65162e-08 56.5L216 55.4358"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M4.00455e-07 38L125.705 35.7537L216 28.8386"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M4.00455e-07 38L125.705 35.7537L216 28.8386"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <path
          d="M8.0866e-07 19.5L105.194 18.377C118.843 18.377 132.465 17.076 145.909 14.4887L216 1"
          stroke="url(#ob-linear-gradient-right)"
        />

        <SvgNode
          path="M8.0866e-07 19.5L105.194 18.377C118.843 18.377 132.465 17.076 145.909 14.4887L216 1"
          :position="position"
          :visible="true"
          dot-color="#FDEFAA"
          glow-color="#FFE358"
        />

        <defs>
          <linearGradient
            id="ob-linear-gradient-right"
            x1="648.247"
            y1="-42.3859"
            x2="-1.18927"
            y2="-0.855247"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-color="white" stop-opacity="0" />
            <stop offset="0.7" stop-color="white" stop-opacity="0.2" />
            <stop offset="1" stop-color="white" stop-opacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="feature__meta meta--center">
      <div class="meta__title">Optimized build</div>
      <div class="meta__description">
        Pre-configured Rollup build with multi-page and library mode support.
      </div>
    </div>
  </div>
</template>

<style scoped>
.feature__visualization {
  .left-lines {
    position: absolute;
    top: 60px;
    right: 50%;
  }

  .right-lines {
    position: absolute;
    top: 71px;
    left: 50%;
  }
}
</style>
