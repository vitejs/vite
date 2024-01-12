<script setup>
const props = defineProps({
  title: {
    type: String,
    default: null,
  },
  description: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'blue',
  },
})
</script>

<template>
  <section class="feature-section">
    <!-- Section Title -->
    <div class="feature-section__title">
      <svg
        v-if="type === 'blue'"
        xmlns="http://www.w3.org/2000/svg"
        width="70"
        height="61"
        viewBox="0 0 70 61"
        fill="none"
      >
        <path
          d="M38.5 0.772461V60.5215M22.6301 60.7725V38.7905C22.6301 25.3784 17.3675 12.5156 8 3.03184M54.3699 60.7725V38.7905C54.3699 25.3784 59.6325 12.5156 69 3.03184"
          stroke="url(#paint0_linear_724_6724)"
          stroke-width="2"
        />
        <path
          d="M38.5 0.772461V60.5215M22.6301 60.7725V38.7905C22.6301 25.3784 17.3675 12.5156 8 3.03184M54.3699 60.7725V38.7905C54.3699 25.3784 59.6325 12.5156 69 3.03184"
          stroke="url(#paint1_radial_724_6724)"
          stroke-width="2"
        />
        <g filter="url(#filter0_f_724_6724)">
          <ellipse
            cx="20.9788"
            cy="25.7384"
            rx="3.89362"
            ry="9.19791"
            fill="#41D1FF"
          />
        </g>
        <ellipse
          cx="20.9788"
          cy="25.7383"
          rx="3.89362"
          ry="3.94196"
          fill="#41D1FF"
        />
        <ellipse
          cx="20.9788"
          cy="25.7383"
          rx="3.89362"
          ry="3.94196"
          fill="white"
          fill-opacity="0.5"
        />
        <defs>
          <filter
            id="filter0_f_724_6724"
            x="0.702227"
            y="0.157549"
            width="40.5533"
            height="51.162"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="8.19149"
              result="effect1_foregroundBlur_724_6724"
            />
          </filter>
          <linearGradient
            id="paint0_linear_724_6724"
            x1="38.5"
            y1="0.772461"
            x2="38.5"
            y2="60.7725"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#404040" stop-opacity="0" />
            <stop offset="0.485224" stop-color="#737373" />
            <stop offset="1" stop-color="#404040" stop-opacity="0" />
          </linearGradient>
          <radialGradient
            id="paint1_radial_724_6724"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(20.9787 24.4242) rotate(74.4747) scale(21.8199 18.295)"
          >
            <stop stop-color="#41D1FF" />
            <stop offset="1" stop-color="#41D1FF" stop-opacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <svg
        v-if="type === 'pink'"
        xmlns="http://www.w3.org/2000/svg"
        width="69"
        height="62"
        viewBox="0 0 69 62"
        fill="none"
      >
        <path
          d="M31 1.5V61.249M15.3902 61.5V39.518C15.3902 26.1059 10.2139 13.2432 1 3.75938M46.6098 61.5V39.518C46.6098 26.1059 51.7861 13.2432 61 3.75938"
          stroke="url(#paint0_linear_724_6980)"
          stroke-width="2"
        />
        <path
          d="M31 1.5V61.249M15.3902 61.5V39.518C15.3902 26.1059 10.2139 13.2432 1 3.75938M46.6098 61.5V39.518C46.6098 26.1059 51.7861 13.2432 61 3.75938"
          stroke="url(#paint1_radial_724_6980)"
          stroke-width="2"
        />
        <g filter="url(#filter0_f_724_6980)">
          <ellipse
            cx="47.8298"
            cy="26.4657"
            rx="3.82979"
            ry="9.19791"
            fill="#BD34FE"
          />
        </g>
        <ellipse
          cx="47.8298"
          cy="26.4659"
          rx="3.82979"
          ry="3.94196"
          fill="#BD34FE"
        />
        <ellipse
          cx="47.8298"
          cy="26.4659"
          rx="3.82979"
          ry="3.94196"
          fill="white"
          fill-opacity="0.5"
        />
        <defs>
          <filter
            id="filter0_f_724_6980"
            x="27.617"
            y="0.884844"
            width="40.4255"
            height="51.1617"
            filterUnits="userSpaceOnUse"
            color-interpolation-filters="sRGB"
          >
            <feFlood flood-opacity="0" result="BackgroundImageFix" />
            <feBlend
              mode="normal"
              in="SourceGraphic"
              in2="BackgroundImageFix"
              result="shape"
            />
            <feGaussianBlur
              stdDeviation="8.19149"
              result="effect1_foregroundBlur_724_6980"
            />
          </filter>
          <linearGradient
            id="paint0_linear_724_6980"
            x1="31"
            y1="1.5"
            x2="31"
            y2="61.5"
            gradientUnits="userSpaceOnUse"
          >
            <stop stop-color="#404040" stop-opacity="0" />
            <stop offset="0.485224" stop-color="#737373" />
            <stop offset="1" stop-color="#404040" stop-opacity="0" />
          </linearGradient>
          <radialGradient
            id="paint1_radial_724_6980"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(48.5 26) rotate(88.6361) scale(21.006 17.3643)"
          >
            <stop stop-color="#BD34FE" />
            <stop offset="1" stop-color="#BD34FE" stop-opacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <h2 :style="{ '--text-color': type === 'blue' ? '#41D1FF' : '#BD34FE' }">
        {{ title }}
      </h2>
      <h3 v-if="description">{{ description }}</h3>
    </div>

    <!-- Section Grid -->
    <div class="feature-section__grid">
      <slot></slot>
    </div>
  </section>
</template>

<style>
.feature-section {
  display: flex;
  flex-direction: column;
  margin: 0 auto;
  gap: 0;
  align-items: center;

  svg {
    margin-bottom: 15px;
  }

  h2 {
    --text-color: #404040;
    background: radial-gradient(
      circle 300px at 30% -180%,
      var(--text-color) 0%,
      #ffffff 100%
    );
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow:
      0 0 4px rgba(255, 255, 255, 0.1),
      0 0 14px rgba(130, 168, 236, 0.2);
  }

  .feature-section__title {
    display: flex;
    flex-direction: column;
    margin: 0 auto;
    width: fit-content;
    align-items: center;
    gap: 10px;
    text-align: center;
  }

  .feature-section__grid {
    display: grid;
    grid: auto / repeat(1, 1fr);
    grid-gap: 30px;
    margin: 45px auto 0;
    width: 100%;
    padding: 0 32px;

    @media (min-width: 768px) {
      width: 1194px;
      max-width: 100%;
      grid: auto / repeat(6, 1fr);
      margin: 80px auto 0;
    }
  }

  .feature-card {
    border-radius: 12px;
    border: 1px solid rgba(38, 38, 38, 0.7);
    background: #141414;
    min-height: 350px;
    display: flex;
    justify-content: flex-start;
    align-items: flex-end;
    padding: 32px;
    position: relative;
    overflow: hidden;

    .feature__meta {
      max-width: 275px;
      position: relative;
      z-index: 2;

      .meta__title {
        color: #fff;
        font-family: Manrope, sans-serif;
        font-size: 20px;
        font-style: normal;
        font-weight: 600;
        line-height: normal;
        letter-spacing: -0.4px;
        margin-bottom: 8px;
        cursor: default;
      }

      .meta__description {
        color: #a3a3a3;
        font-family: Inter, sans-serif;
        font-size: 16px;
        font-style: normal;
        font-weight: 400;
        line-height: 150%;
        letter-spacing: -0.32px;
        text-wrap: balance;
        cursor: default;
      }

      &.meta--center {
        margin: 0 auto;
        text-align: center;
      }
    }

    .feature__visualization {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 0;
    }

    &:nth-child(1),
    &:nth-child(4) {
      grid-column: span 1;

      @media (min-width: 768px) {
        grid-column: span 3;
      }

      @media (min-width: 1200px) {
        grid-column: span 2;
      }
    }

    &:nth-child(2),
    &:nth-child(3) {
      grid-column: span 1;

      @media (min-width: 768px) {
        grid-column: span 3;
      }

      @media (min-width: 1200px) {
        grid-column: span 4;
      }
    }
  }
}
</style>
