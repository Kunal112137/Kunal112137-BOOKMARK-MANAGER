"use client";

import React from "react";
import { supabase } from "../lib/supabaseClient";

export default function LogoutButton() {
  async function signOut() {
    await supabase.auth.signOut();
    // page will react to auth change via AuthProvider
  }

  return (
    <button
      onClick={signOut}
      className="rounded bg-gray-200 px-3 py-1 text-sm hover:bg-gray-300"
    >
      Sign out
    </button>
  );
}
