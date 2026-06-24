import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"
import SignOutButton from "@/components/SignOutButton"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm">💼</span>
              </div>
              <span className="font-bold text-gray-900">Job Tracker</span>
            </div>
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Applications
              </Link>
              <Link href="/dashboard/stats" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                Stats
              </Link>
            </div>
          </div>
          <SignOutButton />
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}