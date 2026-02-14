'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function BookmarkList() {
  const [bookmarks, setBookmarks] = useState<any[]>([])
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')

  // Initial load and subscription setup
  useEffect(() => {
    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session?.user.id) {
        setUserId(data.session.user.id)
        await fetchBookmarks(data.session.user.id, 'newest')
      }
    }
    init()
  }, [])

  // Realtime subscription
  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(`bookmarks-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          setBookmarks((prev) => [payload.new, ...prev])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          setBookmarks((prev) => prev.filter((b) => b.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId])

  async function fetchBookmarks(uid: string, order: 'newest' | 'oldest') {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: order === 'oldest' })

    setBookmarks(data || [])
  }

  function formatDate(dateString: string): string {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    // Show absolute date and time (e.g. "Feb 13, 2026, 2:05 PM")
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function validateUrl(urlStr: string): boolean {
    try {
      const u = new URL(urlStr)
      return ['http:', 'https:'].includes(u.protocol)
    } catch {
      return false
    }
  }

  async function addBookmark(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!userId || !url.trim()) {
      setError('URL is required')
      return
    }

    const urlToAdd = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`

    if (!validateUrl(urlToAdd)) {
      setError('Invalid URL format')
      return
    }

    setLoading(true)
    try {
      const { error: err } = await supabase.from('bookmarks').insert([
        {
          title: title.trim() || urlToAdd,
          url: urlToAdd,
          user_id: userId,
        },
      ])

      if (err) {
        setError(err.message)
      } else {
        setTitle('')
        setUrl('')
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function deleteBookmark(id: string) {
    if (!userId) return
    setDeleting(id)
    try {
      await supabase.from('bookmarks').delete().eq('id', id).eq('user_id', userId)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setDeleting(null)
    }
  }

  async function handleSortChange(order: 'newest' | 'oldest') {
    setSortOrder(order)
    if (userId) {
      await fetchBookmarks(userId, order)
    }
  }

  async function handleRefresh() {
    if (!userId) return
    try {
      setRefreshing(true)
      await fetchBookmarks(userId, sortOrder)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="w-full space-y-6">
      {/* Form */}
      <form onSubmit={addBookmark} className="space-y-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 p-4 dark:from-slate-800 dark:to-slate-900">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bookmark title (optional)"
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
        />
        <div className="flex gap-2">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-slate-600 dark:bg-slate-700 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-500/30"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-gradient-to-r from-green-500 to-green-600 px-6 py-2.5 font-semibold text-white transition hover:from-green-600 hover:to-green-700 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>
        {error && <div className="rounded-lg bg-red-100 p-2 text-sm text-red-800 dark:bg-red-900/30 dark:text-red-300">{error}</div>}
      </form>

      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          {bookmarks.length} {bookmarks.length === 1 ? 'bookmark' : 'bookmarks'}
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSortChange('newest')}
            className={`rounded-lg px-4 py-2 font-medium transition ${
              sortOrder === 'newest'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Newest
          </button>
          <button
            onClick={handleRefresh}
            className={`rounded-lg px-4 py-2 font-medium transition bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600`}
            aria-label="Refresh bookmarks"
          >
            {refreshing ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.25" />
                  <path d="M22 12a10 10 0 00-10-10" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
                Refresh
              </span>
            ) : (
              'Refresh'
            )}
          </button>
          <button
            onClick={() => handleSortChange('oldest')}
            className={`rounded-lg px-4 py-2 font-medium transition ${
              sortOrder === 'oldest'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-white hover:bg-gray-300 dark:hover:bg-slate-600'
            }`}
          >
            Oldest
          </button>
        </div>
      </div>

      {/* Bookmarks List */}
      {bookmarks.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center dark:border-slate-600">
          <p className="text-gray-500 dark:text-slate-400">No bookmarks yet. Add one to get started!</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {bookmarks.map((b) => (
            <li
              key={b.id}
              className="group rounded-lg border border-gray-200 bg-white p-4 transition hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block font-semibold text-blue-600 hover:text-blue-800 hover:underline dark:text-blue-400 dark:hover:text-blue-300 truncate"
                  >
                    {b.title}
                  </a>
                  <p className="truncate text-xs text-gray-500 dark:text-slate-400 mt-1">{b.url}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1.5">
                    Added {formatDate(b.created_at)}
                  </p>
                </div>
                <button
                  onClick={() => deleteBookmark(b.id)}
                  disabled={deleting === b.id}
                  className="flex-shrink-0 rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600 disabled:opacity-50"
                >
                  {deleting === b.id ? '...' : 'Delete'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}