"use client"

import { useEffect, useState } from "react"
import AddApplicationModal from "@/components/AddApplicationModal"
import ApplicationCard from "@/components/ApplicationCard"
import KanbanBoard from "@/components/KanbanBoard"

export type Status = "APPLIED" | "PHONE_SCREEN" | "INTERVIEW" | "OFFER" | "REJECTED"

export type Application = {
  id: string
  company: string
  role: string
  status: Status
  location?: string
  salary?: string
  jobUrl?: string
  followUpDate?: string
  appliedDate: string
  createdAt: string
}

const STATUS_LABELS: Record<Status, string> = {
  APPLIED: "Applied",
  PHONE_SCREEN: "Phone Screen",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
}

const STATUS_COLORS: Record<Status, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  PHONE_SCREEN: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
}

export { STATUS_LABELS, STATUS_COLORS }

type View = "list" | "kanban"

export default function DashboardPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterStatus, setFilterStatus] = useState<Status | "ALL">("ALL")
  const [view, setView] = useState<View>("list")

  const fetchApplications = async () => {
    const res = await fetch("/api/applications")
    const data = await res.json()
    setApplications(data)
    setLoading(false)
  }

  // Update a single application in local state without refetching
  const updateLocalApplication = (id: string, newStatus: Status) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === id ? { ...app, status: newStatus } : app))
    )
  }

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const res = await fetch("/api/applications")
      const data = await res.json()
      if (mounted) {
        setApplications(data)
        setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  const filtered =
    filterStatus === "ALL"
      ? applications
      : applications.filter((a) => a.status === filterStatus)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
          <p className="text-gray-500 text-sm mt-1">
            {applications.length} total applications
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "list"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ☰ List
            </button>
            <button
              onClick={() => setView("kanban")}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === "kanban"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              ⊞ Board
            </button>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            + Add Application
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {view === "list" && (
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["ALL", "APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"] as const).map(
            (status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filterStatus === status
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-300"
                }`}
              >
                {status === "ALL" ? "All" : STATUS_LABELS[status]}
                {status !== "ALL" && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {applications.filter((a) => a.status === status).length}
                  </span>
                )}
              </button>
            )
          )}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24" />
          ))}
        </div>
      ) : view === "kanban" ? (
        <KanbanBoard
          applications={applications}
          onUpdateLocal={updateLocalApplication}
          onRefetch={fetchApplications}
        />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500">No applications yet — add your first one!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onUpdate={fetchApplications}
              onDelete={fetchApplications}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddApplicationModal
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false)
            fetchApplications()
          }}
        />
      )}
    </div>
  )
}
