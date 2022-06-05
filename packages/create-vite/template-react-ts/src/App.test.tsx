import { describe, expect, it } from 'vitest'
import { render, screen, userEvent } from './test/utils'
import App from './App'

describe('App', () => {
  it('the title is visible', () => {
    render(<App />)
    expect(screen.getByText(/Hello Vite \+ React!/i)).toBeInTheDocument()
  })

  it('should increment count on click', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button'))
    expect(await screen.findByText(/count is: 1/i)).toBeInTheDocument()
  })
})
