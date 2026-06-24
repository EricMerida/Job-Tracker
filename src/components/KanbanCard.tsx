"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Application } from "@/app/dashboard/page"

type Props = {
  application: Application
  onRefetch: () => void
  isDragging?: boolean
}

export default function KanbanCard({ application, onRefetch, isDragging }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: application.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.3 : 1,
  }

  const handleDelete = async () => {
    if (!confirm("Delete this application?")) return
    await fetch(`/api/applications/${application.id}`, { method: "DELETE" })
    onRefetch()
  }

  const isOverdue =
    application.followUpDate &&
    new Date(application.followUpDate) < new Date()

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg p-3 border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing transition-all ${
        isDragging ? "shadow-lg rotate-1 border-indigo-200" : "hover:border-indigo-200"
      }`}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {application.company}
          </p>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {application.role}
          </p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete()
          }}
          className="text-gray-300 hover:text-red-400 transition-colors text-xs flex-shrink-0"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 space-y-1">
        {application.location && (
          <p className="text-xs text-gray-400">
            📍 {application.location}
          </p>
        )}
        {application.salary && (
          <p className="text-xs text-gray-400">
            💰 {application.salary}
          </p>
        )}
        {application.followUpDate && (
          <p className={`text-xs ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
            🔔 {new Date(application.followUpDate).toLocaleDateString()}
            {isOverdue && " (overdue)"}
          </p>
        )}
        {application.jobUrl && (
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-indigo-500 hover:underline block"
          >
            View job ↗
          </a>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-50">
        <p className="text-xs text-gray-400">
          {new Date(application.appliedDate).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}
