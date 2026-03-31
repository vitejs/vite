import { type Ref, onBeforeUnmount, onMounted, ref } from 'vue'

type YoutubeState = 'play' | 'pause' | 'end' | 'buffer' | 'unstarted' | 'cued'

interface YoutubePlayerState {
  state: YoutubeState
}

const STATE_BY_CODE: Record<number, YoutubeState> = {
  [-1]: 'unstarted',
  [0]: 'end',
  [1]: 'play',
  [2]: 'pause',
  [3]: 'buffer',
  [5]: 'cued',
}

export const useYoutubePlayer = (iframeEl: Ref<HTMLIFrameElement | null>) => {
  const player = ref<YoutubePlayerState>({ state: 'pause' })

  const postPlayerCommand = (func: string, args: unknown[] = []) => {
    const frameWindow = iframeEl.value?.contentWindow
    if (!frameWindow) return

    frameWindow.postMessage(
      JSON.stringify({
        event: 'command',
        func,
        args,
      }),
      '*',
    )
  }

  const setStateByCode = (code: number) => {
    player.value = { state: STATE_BY_CODE[code] ?? 'pause' }
  }

  const onMessage = (event: MessageEvent) => {
    const frameWindow = iframeEl.value?.contentWindow
    if (!frameWindow || event.source !== frameWindow) return

    let payload: unknown = event.data
    if (typeof payload === 'string') {
      try {
        payload = JSON.parse(payload)
      } catch {
        return
      }
    }

    if (!payload || typeof payload !== 'object') return

    const data = payload as {
      event?: string
      info?: number | { playerState?: number }
    }

    if (data.event === 'onStateChange' && typeof data.info === 'number') {
      setStateByCode(data.info)
      return
    }

    if (
      data.event === 'infoDelivery' &&
      data.info &&
      typeof data.info === 'object' &&
      typeof data.info.playerState === 'number'
    ) {
      setStateByCode(data.info.playerState)
    }
  }

  const initPlayer = () => {
    const frameWindow = iframeEl.value?.contentWindow
    if (!frameWindow) return

    frameWindow.postMessage(JSON.stringify({ event: 'listening' }), '*')
    postPlayerCommand('addEventListener', ['onStateChange'])
    postPlayerCommand('getPlayerState')
  }

  const play = () => {
    player.value = { state: 'play' }
    postPlayerCommand('playVideo')
  }

  const pause = () => {
    player.value = { state: 'pause' }
    postPlayerCommand('pauseVideo')
  }

  const seekTo = (seconds: number, allowSeekAhead = true) => {
    postPlayerCommand('seekTo', [seconds, allowSeekAhead])
  }

  const togglePlayback = () => {
    if (player.value.state === 'play') {
      pause()
      return
    }

    play()
  }

  onMounted(() => {
    window.addEventListener('message', onMessage)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('message', onMessage)
  })

  return {
    player,
    initPlayer,
    play,
    pause,
    seekTo,
    togglePlayback,
  }
}
