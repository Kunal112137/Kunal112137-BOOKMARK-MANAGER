"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from 'next/navigation'
import { supabase } from "../lib/supabaseClient";

type User = any;

const AuthContext = createContext<{ user: User | null }>({ user: null });

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    let mounted = true;
    // get initial session
    supabase.auth.getSession().then((res) => {
      if (!mounted) return;
      setUser(res.data.session?.user ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Refresh Next.js server components / cached data so UI reflects auth changes
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        setIsRefreshing(true)
        try {
          router.refresh()
        } catch (e) {
          // ignore in environments where refresh isn't available
        }
        // show the visual indicator briefly even if refresh is fast
        setTimeout(() => setIsRefreshing(false), 900)
      }
    });

    return () => {
      mounted = false;
      sub?.subscription.unsubscribe();
    };
  }, []);

  return (
    <>
      {/* small top progress indicator shown while app refreshes */}
      <div aria-hidden>
        <div
          className={`fixed inset-x-0 top-0 h-1 z-50 transition-all duration-300 ${
            isRefreshing ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="h-1 bg-blue-500 w-full animate-pulse" />
        </div>
      </div>
      <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
    </>
  )
}

export default AuthProvider;
