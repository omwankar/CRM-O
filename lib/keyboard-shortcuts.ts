type ShortcutHandler = () => void;

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  handler: ShortcutHandler;
  description: string;
}

const shortcuts: Shortcut[] = [];

export function registerShortcut(shortcut: Shortcut) {
  shortcuts.push(shortcut);
}

export function unregisterShortcut(key: string) {
  const index = shortcuts.findIndex(s => s.key === key);
  if (index > -1) shortcuts.splice(index, 1);
}

export function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    for (const shortcut of shortcuts) {
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        e.preventDefault();
        shortcut.handler();
        break;
      }
    }
  });
}

export function getShortcuts() {
  return shortcuts;
}

// Common shortcuts
export const COMMON_SHORTCUTS = {
  SEARCH: { key: 'k', ctrl: true, description: 'Open global search' },
  NEW: { key: 'n', ctrl: true, description: 'Create new item' },
  SAVE: { key: 's', ctrl: true, description: 'Save' },
  DELETE: { key: 'Delete', description: 'Delete selected' },
  ESCAPE: { key: 'Escape', description: 'Close modal/panel' },
} as const;
