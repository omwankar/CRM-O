'use client'

import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

/** App is light-only; kept as a no-op control if referenced later. */
export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" type="button" aria-label="Light theme" disabled>
      <Sun className="h-4 w-4" />
      <Moon className="hidden h-4 w-4" />
    </Button>
  )
}
