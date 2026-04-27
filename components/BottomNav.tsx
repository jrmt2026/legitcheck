'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Home, Search, Flag, BookOpen, UserCircle, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const HIDDEN_PREFIXES = ['/auth/', '/admin', '/dashboard/agents']

export default function BottomNav() {
  const path = usePathname()
  const [isAuth, setIsAuth] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setIsAuth(!!user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuth(!!session?.user)
    })
    return () => subscription.unsubscribe()
  }, [])

  const hide = HIDDEN_PREFIXES.some(p => path.startsWith(p))
  if (hide) return null

  const items = isAuth
    ? [
        { href: '/dashboard', icon: Home,          label: 'Home'    },
        { href: '/buyer',     icon: Search,        label: 'Check'   },
        { href: '/report',    icon: Flag,          label: 'Report'  },
        { href: '/library',   icon: BookOpen,      label: 'Library' },
        { href: '/profile',   icon: UserCircle,    label: 'Profile' },
      ]
    : [
        { href: '/',         icon: Home,          label: 'Home'    },
        { href: '/buyer',    icon: Search,        label: 'Check'   },
        { href: '/sos',      icon: AlertTriangle, label: 'SOS'     },
        { href: '/report',   icon: Flag,          label: 'Report'  },
        { href: '/library',  icon: BookOpen,      label: 'Library' },
      ]

  return (
    <>
      <div className="h-[72px] md:hidden" aria-hidden />
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
      >
        <div className="bg-paper/95 border-t border-line pb-safe">
          <div className="flex items-center justify-around px-1 pt-1 pb-1 max-w-lg mx-auto">
            {items.map(({ href, icon: Icon, label }) => {
              const active = href === '/' ? path === '/' : path === href || path.startsWith(href + '/')
              const isSOS = href === '/sos'
              return (
                <Link
                  key={href}
                  href={href}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl min-w-[56px] transition-all active:scale-90 ${
                    isSOS ? 'text-brand-red' : active ? 'text-ink' : 'text-ink-3 hover:text-ink-2'
                  }`}
                >
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.5 : 1.5}
                    className={`transition-all ${isSOS ? 'text-brand-red' : active ? 'text-ink' : 'text-ink-3'}`}
                  />
                  <span className={`text-[10px] font-medium leading-none transition-all ${
                    isSOS ? 'text-brand-red font-bold' : active ? 'text-ink' : 'text-ink-3'
                  }`}>
                    {label}
                  </span>
                  {active && !isSOS && (
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
