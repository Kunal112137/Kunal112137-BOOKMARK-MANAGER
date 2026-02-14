'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import BookmarkList from '@/components/BookmarkList'

export default function Home() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
      } else {
        setSession(data.session)
      }
      setLoading(false)
    }
    checkSession()
  }, [router])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-slate-900 dark:to-slate-800">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed dark:bg-slate-900"
      style={{
        backgroundImage: "url('/background.jpg')",
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backgroundBlendMode: 'overlay',
      }}
    >
      {/* Header */}
      <header className="border-b border-white/20 bg-black/30 backdrop-blur-md shadow-lg dark:bg-slate-800/50">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500">
              <span className="text-lg font-bold text-white">📚</span>
            </div>
            <h1 className="text-2xl font-bold text-white dark:text-white">Smart Bookmarks</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block">
              <p className="text-sm text-white/80 dark:text-slate-300">{session?.user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="rounded-lg bg-red-500/90 px-4 py-2 font-medium text-white transition hover:bg-red-600 backdrop-blur-sm dark:bg-red-600/70 dark:hover:bg-red-700"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white drop-shadow-lg dark:text-white">Your Bookmarks</h2>
          <p className="mt-2 text-white/80 drop-shadow-md dark:text-slate-300">Save and organize your favorite links</p>
        </div>

        <div className="rounded-2xl bg-white/95 backdrop-blur-sm shadow-2xl overflow-hidden dark:bg-slate-800/95">
          <div className="p-8">
            <BookmarkList />
          </div>
        </div>
      </main>
    </div>
  )
}
