import { isBuild, mochaSetup, mochaReset } from '../../testUtils'

const mode = isBuild ? `production` : `development`

describe('env.spec.ts', () => {
  before(mochaSetup)
  after(mochaReset)

  it('base', async () => {
    expect(await page.textContent('.base')).toBe('/')
  })

  it('mode', async () => {
    expect(await page.textContent('.mode')).toBe(mode)
  })

  it('dev', async () => {
    expect(await page.textContent('.dev')).toBe(String(!isBuild))
  })

  it('prod', async () => {
    expect(await page.textContent('.prod')).toBe(String(isBuild))
  })

  it('custom', async () => {
    expect(await page.textContent('.custom')).toBe('1')
  })

  it('custom-prefix', async () => {
    expect(await page.textContent('.custom-prefix')).toBe('1')
  })

  it('mode file override', async () => {
    expect(await page.textContent('.mode-file')).toBe(`.env.${mode}`)
  })

  it('inline variables', async () => {
    expect(await page.textContent('.inline')).toBe(
      isBuild ? `inline-build` : `inline-serve`
    )
  })

  it('NODE_ENV', async () => {
    expect(await page.textContent('.node-env')).toBe(mode)
  })

  it('env object', async () => {
    const envText = await page.textContent('.env-object')
    expect(JSON.parse(envText)).toMatchObject({
      VITE_EFFECTIVE_MODE_FILE_NAME: `.env.${mode}`,
      CUSTOM_PREFIX_ENV_VARIABLE: '1',
      VITE_CUSTOM_ENV_VARIABLE: '1',
      BASE_URL: '/',
      MODE: mode,
      DEV: !isBuild,
      PROD: isBuild
    })
  })
})
