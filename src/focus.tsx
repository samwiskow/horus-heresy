import { useLayoutEffect, useRef, useSyncExternalStore, type KeyboardEvent, type ReactNode } from 'react'

const mobileQuery = '(max-width: 760px)'

function subscribeToMobileLayout(onChange: () => void) {
  const query = window.matchMedia(mobileQuery)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function useMobileLayout() {
  return useSyncExternalStore(subscribeToMobileLayout, () => window.matchMedia(mobileQuery).matches, () => false)
}

export function restoreFocus(...targets: (HTMLElement | SVGElement | null | undefined)[]) {
  for (const target of targets) {
    if (!target?.isConnected || !target.getClientRects().length || target.matches(':disabled')) continue
    target.focus({ preventScroll: true })
    if (document.activeElement === target) {
      if (!(target instanceof SVGElement)) target.scrollIntoView({ block: 'nearest', inline: 'nearest' })
      return
    }
  }
}

function wrapTab(event: KeyboardEvent<HTMLDialogElement>) {
  if (event.key !== 'Tab') return
  const controls = [...event.currentTarget.querySelectorAll<HTMLElement | SVGElement>('button, a[href], input, select, summary, [tabindex]')]
    .filter((element) => element.tabIndex >= 0 && !element.matches(':disabled') && element.getClientRects().length)
  const first = controls[0]
  const last = controls.at(-1)
  if (!first || document.activeElement === (event.shiftKey ? first : last)) {
    event.preventDefault()
    const target = event.shiftKey ? last : first
    target?.focus()
  }
}

export function FocusDialog({ label, className, onClose, children }: { label: string; className: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const dialog = ref.current!
    const initialFocus = dialog.querySelector<HTMLElement>('[data-initial-focus]')
    if (initialFocus) initialFocus.autofocus = true
    dialog.showModal()
    if (document.activeElement !== initialFocus) initialFocus?.focus({ preventScroll: true })
    return () => dialog.close()
  }, [])
  return <dialog ref={ref} aria-label={label} className={className}
    onCancel={(event) => { event.preventDefault(); onClose() }} onKeyDown={wrapTab}>{children}</dialog>
}
