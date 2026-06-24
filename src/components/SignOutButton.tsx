"use client"

import { signOut, useSession } from "next-auth/react"

export default function SignOutButton() {
  const { data: session } = useSession()

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">{session?.user?.email}</span>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-gray-500 hover:text-red-500 transition-colors"
      >
        Sign out
      </button>
    </div>
  )
}
