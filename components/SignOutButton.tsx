'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SignOutButton() {
  async function handleSignOut() {
    await createClient().auth.signOut()
    window.location.href = '/'
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-white/30 hover:text-white/70 transition-colors p-1"
      aria-label="Sign out"
    >
      <LogOut size={17} />
    </button>
  )
}
