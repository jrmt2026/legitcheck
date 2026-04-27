'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Search, FlaskConical, Flag, BookOpen, UserCircle } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/',        icon: Home,          label: 'Home'    },
  { href: '/buyer',   icon: Search,        label: 'Check'   },
  { href: '/demo',    icon: FlaskConical,  label: 'Demo'    },
  { href: '/report',  icon: Flag,          label: 'Report'  },
  { href: '/library', icon: BookOpen,      label: 'Library' },
]

const NAV_ITEMS_AUTH = [
  { href: '/dashboard', icon: Home,          label: 'Home'    },
  { href: '/buyer',     icon: Search,        label: 'Check'   },
  { href: '/report',    icon: Flag,          label: 'Report'  },
  { href: '/library',   icon: BookOpen,      label: 'Library' },
  { href: '/profile',   icon: UserCircle,    label: 'Profile' },
]

const HIDDEN_PREFIXES = ['/auth/', '/admin', '/dashboard/agents']

export default function BottomNav() {
  const path = usePathname()

  const hide = HIDDEN_PREFIXES.some(p => path.startsWith(p))
  if (hide) return null

  return (
    <>
      {/* spacer so page content doesn't hide behind the nav */}
      <div className="h-[72px] md:hidden" aria-hidden />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="bg-paper/95 border-t border-line pb-safe">
          <div className="flex items-center justify-around px-1 pt-1 pb-1 max-w-lg mx-auto">
            {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
              const active =
                href === '/'
                  ? path === '/'
                  : path === href || path.startsWith(href + '/')

              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-all active:scale-90 ${
                    active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.5}
                    className={`transition-all ${active ? 'text-ink' : 'text-ink-3'}`}
                  />
                  <span
                    className={`text-[10px] font-medium leading-none transition-all ${
                      active ? 'text-ink' : 'text-ink-3'
                    }`}
                  >
                    {label}
                  </span>
                  {active && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ink" />
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </>
  )
}
