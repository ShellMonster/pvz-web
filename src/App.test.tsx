import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { formatShellLabel } from '@/lib/appMeta'
import { AppRoutes } from '@/routes/AppRoutes'

describe('App shell', () => {
  it('mounts landscape shell on home via AppRoutes', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>,
    )

    expect(screen.getByTestId('landscape-shell')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: formatShellLabel() }),
    ).toBeInTheDocument()
    expect(screen.getByTestId('page-home')).toBeInTheDocument()
  })
})
