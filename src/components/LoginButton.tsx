"use client";


import React from "react";
import { supabase } from "../lib/supabaseClient";

export default function LoginButton() {
  async function signIn() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
  }

  return (
    <button
      onClick={signIn}
      className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Sign in with Google
    </button>
  );
}
