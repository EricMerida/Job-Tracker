"use client"

import { useState } from "react"
import { Application, STATUS_LABELS, STATUS_COLORS, Status } from "@/app/dashboard/page"

type Props = {
  application: Application
  onUpdate: () => void
  onDelete: () => void
}

export default function ApplicationCard({ application, onUpdate, onDelete }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Delete this application?")) return
    setDeleting(true)
    await fetch(`/api/applications/${application.id}`, { method: "DELETE" })
    onDelete()
  }

  const handleStatusChange = async (status: Status) => {
    await fetch(`/api/applications/${application.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    })
    setEditingStatus(false)
    onUpdate()
  }

  const isOverdue =
    application.followUpDate &&
    new Date(application.followUpDate) < new Date()

  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100 hover:border-indigo-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-semibold text-gray-900">{application.company}</h3>
            {editingStatus ? (
              <select
                autoFocus
                className="text-xs border border-indigo-300 rounded-full px-2 py-0.5 focus:outline-none"
                value={application.status}
                onChange={(e) => handleStatusChange(e.target.value as Status)}
                onBlur={() => setEditingStatus(false)}
              >
                <option value="APPLIED">Applied</option>
                <option value="PHONE_SCREEN">Phone Screen</option>
                <option value="INTERVIEW">Interview</option>
                <option value="OFFER">Offer</option>
                <option value="REJECTED">Rejected</option>
              </select>
            ) : (
              <button
                onClick={() => setEditingStatus(true)}
                className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${STATUS_COLORS[application.status]}`}
              >
                {STATUS_LABELS[application.status]}
              </button>
            )}
          </div>

          <p className="text-gray-500 text-sm mt-0.5">{application.role}</p>

          <div className="flex items-center gap-4 mt-2 flex-wrap">
            {application.location && (
              <span className="text-xs text-gray-400">
                📍 {application.location}
              </span>
            )}
            {application.salary && (
              <span className="text-xs text-gray-400">
                💰 {application.salary}
              </span>
            )}
            <span className="text-xs text-gray-400">
              📅 Applied {new Date(application.appliedDate).toLocaleDateString()}
            </span>
            {application.followUpDate && (
              <span className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
                🔔 Follow up {new Date(application.followUpDate).toLocaleDateString()}
                {isOverdue && " (overdue)"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {application.jobUrl && (
            <a
              href={application.jobUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-600 hover:underline"
            >
              View job ↗
            </a>
          )}
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            {deleting ? "..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  )
}
