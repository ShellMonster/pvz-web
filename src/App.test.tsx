import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '@/App'
import { formatShellLabel } from '@/lib/appMeta'

describe('App shell', () => {
  it('renders landscape-ready shell with product title via @/ import', () => {
    render(<App />)

    expect(screen.getByTestId('landscape-shell')).toBeInTheDocument()
    // Assert against the same shipped helper App uses (breaks if App hardcodes a diverging title).
    expect(
      screen.getByRole('heading', { name: formatShellLabel() }),
    ).toBeInTheDocument()
    expect(screen.getByText(/脚手架就绪/)).toBeInTheDocument()
  })
})
