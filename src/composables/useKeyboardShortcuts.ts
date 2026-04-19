import { onMounted, onUnmounted } from 'vue'

export interface ShortcutBinding {
  key: string
  ctrl?: boolean
  shift?: boolean
  action: () => void
  description: string
}

export function useKeyboardShortcuts(bindings: ShortcutBinding[]) {
  function handler(e: KeyboardEvent) {
    // Don't fire when user is typing in an input/textarea/select
    const tag = (e.target as HTMLElement)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

    for (const b of bindings) {
      const ctrlMatch = b.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey)
      const shiftMatch = b.shift ? e.shiftKey : !e.shiftKey
      if (e.key === b.key && ctrlMatch && shiftMatch) {
        e.preventDefault()
        b.action()
        return
      }
    }
  }

  onMounted(() => window.addEventListener('keydown', handler))
  onUnmounted(() => window.removeEventListener('keydown', handler))
}
