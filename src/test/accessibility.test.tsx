/**
 * Automated accessibility checks over the screens an agent actually works in.
 *
 * What this can and cannot do: axe runs against jsdom, which applies no
 * stylesheet, so everything that depends on rendered pixels - colour contrast,
 * focus-indicator contrast, target size, reflow - is out of reach here and is
 * verified separately. What these tests do catch is the structural half:
 * missing or ambiguous accessible names, unlabelled fields, duplicate ids,
 * broken ARIA references, heading order and list/table semantics. Those are
 * exactly the regressions that a markup refactor introduces silently.
 */
import { describe, expect, it } from 'vitest'
import { screen, waitFor, within } from '@testing-library/react'
import { axe } from 'jest-axe'
import { AppLayout } from '@/components/layout/AppLayout'
import { NewRequestPage } from '@/features/requests/NewRequestPage'
import { RequestDetailPage } from '@/features/requests/RequestDetailPage'
import { RequestListPage } from '@/features/requests/RequestListPage'
import { SignInPage } from '@/pages/SignInPage'
import { renderWithProviders, signIn } from './renderWithProviders'

/**
 * `colour-contrast` needs real styles, so it can never pass or fail here.
 *
 * `region` is disabled only for the screens mounted on their own: in the
 * running application `AppLayout` wraps them in `<main id="main-content">`,
 * and the layout's own check below covers that landmark for real.
 */
const STANDALONE_RULES = {
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
  },
}

const LAYOUT_RULES = { rules: { 'color-contrast': { enabled: false } } }

describe('accessibility', () => {
  it('has no violations on the sign-in screen', async () => {
    const { container } = renderWithProviders(<SignInPage />, { route: '/sign-in' })

    expect(await axe(container, LAYOUT_RULES)).toHaveNoViolations()
  })

  it('has no violations in the application shell', async () => {
    signIn()
    const { container } = renderWithProviders(<AppLayout />, { route: '/requests' })

    expect(await axe(container, LAYOUT_RULES)).toHaveNoViolations()
  })

  it('has no violations on the request list, including the expanded search', async () => {
    signIn()
    const { container, user } = renderWithProviders(<RequestListPage />, {
      route: '/requests',
      path: '/requests',
    })
    const table = await screen.findByRole('table', {}, { timeout: 5000 })
    await within(table).findByText('REQ-1001', {}, { timeout: 5000 })

    expect(await axe(container, STANDALONE_RULES)).toHaveNoViolations()

    // The collapsed search field is a second state of the same screen.
    await user.click(screen.getByRole('button', { name: /Search requests/i }))
    await screen.findByLabelText('Search')

    expect(await axe(container, STANDALONE_RULES)).toHaveNoViolations()
  })

  it('has no violations on the request detail screen', async () => {
    signIn()
    const { container } = renderWithProviders(<RequestDetailPage />, {
      route: '/requests/REQ-1002',
      path: '/requests/:requestId',
    })
    await screen.findByRole('heading', { level: 1 }, { timeout: 5000 })

    expect(await axe(container, STANDALONE_RULES)).toHaveNoViolations()
  })

  it('has no violations on the create form, before and after validation fails', async () => {
    signIn()
    const { container, user } = renderWithProviders(<NewRequestPage />, {
      route: '/requests/new',
    })

    expect(await axe(container, STANDALONE_RULES)).toHaveNoViolations()

    // An invalid form is the state where ARIA wiring usually breaks: the error
    // has to stay reachable from the field that owns it.
    await user.click(screen.getByRole('button', { name: /Create request/i }))
    await waitFor(() =>
      expect(screen.getByLabelText('Title')).toHaveAttribute('aria-invalid', 'true'),
    )

    expect(await axe(container, STANDALONE_RULES)).toHaveNoViolations()
  })
})
