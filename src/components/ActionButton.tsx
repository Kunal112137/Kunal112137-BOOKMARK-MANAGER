"use client"

import React from "react"

type Props = {
  onClick: () => void
  label: string
}

export default function ActionButton({ onClick, label }: Props) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded px-3 py-1 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
      </svg>
      <span>{label}</span>
    </button>
  )
}
