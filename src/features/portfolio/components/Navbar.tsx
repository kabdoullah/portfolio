import { useState } from 'react'
import { motion } from 'framer-motion'
import { Menu } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { ThemeToggle } from '#/components/layout/ThemeToggle'
import { useActiveSection } from '#/features/portfolio/hooks/useActiveSection'
import { NAV_ITEMS, SECTION_IDS } from '#/lib/utils/constants'
import { cn } from '#/lib/utils'

const SECTION_LIST = NAV_ITEMS.map((item) => item.id)

export function Navbar() {
  const activeId = useActiveSection(SECTION_LIST)
  const [open, setOpen] = useState(false)

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl"
    >
      <nav className="mx-auto flex h-16 w-[min(1120px,calc(100%-2rem))] items-center justify-between">
        <a
          href={`#${SECTION_IDS.hero}`}
          className="font-display text-xl font-extrabold tracking-tight"
          aria-label="Retour en haut"
        >
          A<span className="text-primary">K</span>C
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className={cn(
                'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
                activeId === item.id && 'text-foreground',
              )}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetHeader>
                <SheetTitle className="font-display">Navigation</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1 px-2">
                {NAV_ITEMS.map((item) => (
                  <SheetClose asChild key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </motion.header>
  )
}
