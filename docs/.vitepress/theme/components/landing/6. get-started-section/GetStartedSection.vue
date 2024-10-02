<template>
  <div class="get-started-section">
    <div class="vite-chip">
      <svg
        width="134"
        height="134"
        viewBox="0 0 134 134"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g>
          <rect
            class="vite-chip__background"
            x="1"
            y="1"
            width="132"
            height="132"
            rx="10"
            fill="black"
            fill-opacity="0.3"
          />
          <rect
            class="vite-chip__highlight"
            x="1"
            y="1"
            width="132"
            height="132"
            rx="10"
            fill="url(#linear-vite-chip-highlight)"
            fill-opacity="0.1"
          />
          <rect
            x="1"
            y="1"
            width="132"
            height="132"
            rx="10"
            stroke="#111111"
            stroke-opacity="0.2"
            stroke-width="1"
          />
        </g>
        <g opacity="0.6">
          <rect
            x="1"
            y="1"
            width="132"
            height="132"
            rx="10"
            fill="#1E1E1E"
            fill-opacity="0.4"
          />
          <rect
            x="1"
            y="1"
            width="132"
            height="132"
            rx="10"
            stroke="url(#radial-edge)"
            stroke-width="1.15417"
          />
          <rect
            x="1"
            y="1"
            width="132"
            height="132"
            rx="10"
            stroke="url(#radial-edge-2)"
            stroke-opacity="0.1"
            stroke-width="1.15417"
          />
        </g>
        <defs>
          <linearGradient
            id="linear-vite-chip-highlight"
            x1="6.92498"
            y1="15.5812"
            x2="113.685"
            y2="116.571"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stop-opacity="0" />
            <stop offset="0.37" stop-color="white" />
            <stop offset="1" stop-opacity="0" />
          </linearGradient>
          <radialGradient
            id="radial-edge"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(95.2187 56.5541) rotate(110.653) scale(80.173)"
          >
            <stop offset="0" stop-color="white" />
            <stop offset="1" stop-opacity="0" />
          </radialGradient>
          <radialGradient
            id="radial-edge-2"
            cx="0"
            cy="0"
            r="1"
            gradientUnits="userSpaceOnUse"
            gradientTransform="translate(8.65624 122.919) rotate(-21.5713) scale(80.0504)"
          >
            <stop offset="0" stop-color="white" />
            <stop offset="1" stop-opacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <img src="/logo.svg" alt="Vite Logo" class="vite-chip__logo" />
    </div>
    <h2>Start building with Vite</h2>
    <h3>
      Prepare for a development environment that can finally keep pace with the
      speed of your mind.
    </h3>
    <a href="/guide/" class="btn btn--primary">Get started</a>
    <div class="glow glow--purple" />
    <div class="glow glow--blue" />
  </div>
</template>

<style scoped>
.get-started-section {
  margin: 0 auto;
  padding-top: 260px;
  padding-bottom: 220px;
  position: relative;
  overflow: hidden;

  h2 {
    color: #fff;
    font-size: 44px;
    font-style: normal;
    font-weight: 600;
    line-height: 120%;
    letter-spacing: -1px;
    margin: 0 auto 20px;
    text-align: center;
    position: relative;
    z-index: 1;

    @media (min-width: 768px) {
      font-size: 52px;
    }
  }

  h3 {
    margin: 0 auto 40px;
    color: #d4d4d8;
    position: relative;
    z-index: 1;
  }

  .btn {
    margin: 0 auto;
    position: relative;
    z-index: 1;
  }

  .vite-chip {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 84px;
    aspect-ratio: 1;
    filter: drop-shadow(0px 18px 33px rgba(0, 0, 0, 0.5));
    margin: 0 auto 60px;
    border: 1px solid #2b4659;
    border-radius: 6px;
    position: relative;
    z-index: 1;

    &:before {
      content: '';
      position: absolute;
      bottom: -30px;
      left: -20px;
      width: 80px;
      height: 80px;
      background: linear-gradient(180deg, #61d9ff 0%, rgba(0, 0, 0, 0) 100%);
      z-index: -1;
      filter: blur(30px);
    }

    &:after {
      content: '';
      position: absolute;
      top: -20px;
      right: -20px;
      width: 80px;
      height: 80px;
      background: linear-gradient(
        270deg,
        #7a23a1 0%,
        rgba(113, 94, 189, 0.9) 60%,
        rgba(113, 94, 189, 0.9) 80%,
        rgba(189, 52, 254, 0) 100%
      );
      z-index: -1;
      filter: blur(30px);
    }

    svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      max-width: 100%;
      z-index: 2;
      border: 1px solid #2f2f2f;
      border-radius: 5px;
      filter: drop-shadow(0px 10px 5px rgba(0, 0, 0, 0.5));
    }

    .vite-chip__logo {
      position: relative;
      width: 50%;
      opacity: 0.8;
      z-index: 3;
      filter: drop-shadow(
        0 0 0.6rem color-mix(in srgb, #ffffad 50%, transparent)
      );
    }
  }

  .glow {
    &.glow--blue {
      position: absolute;
      bottom: -15%;
      left: -20%;
      width: 80%;
      aspect-ratio: 1.5;
      pointer-events: none;
      z-index: 0;
      border-radius: 100%;
      background: linear-gradient(180deg, #61d9ff 0%, rgba(0, 0, 0, 0) 100%);
      filter: blur(15vw);
      transform: none;
      opacity: 0.5;

      @media (min-width: 768px) {
        filter: blur(10vw);
        bottom: -30%;
        left: -10%;
        opacity: 0.2;
      }

      @media (min-width: 1025px) {
        filter: blur(80px);
        width: 900px;
        left: calc(50% - 700px);
      }
    }

    &.glow--purple {
      position: absolute;
      bottom: -15%;
      right: -20%;
      width: 80%;
      aspect-ratio: 1.5;
      pointer-events: none;
      z-index: 0;
      border-radius: 100%;
      background: linear-gradient(
        270deg,
        #7a23a1 0%,
        rgba(113, 94, 189, 0.9) 60%,
        rgba(113, 94, 189, 0.9) 80%,
        rgba(189, 52, 254, 0) 100%
      );
      filter: blur(15vw);
      transform: none;
      opacity: 0.6;

      @media (min-width: 768px) {
        filter: blur(10vw);
        bottom: -30%;
        right: -10%;
        opacity: 0.3;
      }

      @media (min-width: 1025px) {
        filter: blur(90px);
        width: 1100px;
        right: calc(50% - 700px);
      }
    }
  }
}
</style>
