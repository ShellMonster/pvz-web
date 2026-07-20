import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'

describe('App shell', () => {
  it('renders landscape-ready shell with product title via @/ import', () => {
    render(<App />)

    expect(screen.getByTestId('landscape-shell')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: /植物大战僵尸 · 16:9/ }),
    ).toBeInTheDocument()
    expect(screen.getByText(/脚手架就绪/)).toBeInTheDocument()
  })
})
