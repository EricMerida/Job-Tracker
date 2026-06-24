"use client"

import { useState } from "react"
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Application, Status, STATUS_LABELS } from "@/app/dashboard/page"
import KanbanCard from "./KanbanCard"

type Props = {
  applications: Application[]
  onUpdateLocal: (id: string, status: Status) => void
  onRefetch: () => void
}

const COLUMNS: Status[] = ["APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"]

const COLUMN_COLORS: Record<Status, string> = {
  APPLIED: "border-t-blue-400",
  PHONE_SCREEN: "border-t-yellow-400",
  INTERVIEW: "border-t-purple-400",
  OFFER: "border-t-green-400",
  REJECTED: "border-t-red-400",
}

export default function KanbanBoard({ applications, onUpdateLocal, onRefetch }: Props) {
  const [activeApp, setActiveApp] = useState<Application | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  )

  const getAppsByStatus = (status: Status) =>
    applications.filter((app) => app.status === status)

  const handleDragStart = (event: DragStartEvent) => {
    const app = applications.find((a) => a.id === event.active.id)
    if (app) setActiveApp(app)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveApp(null)

    if (!over) return

    const draggedApp = applications.find((a) => a.id === active.id)
    if (!draggedApp) return

    // Check if dropped on a column or a card
    let newStatus: Status | null = null

    if (COLUMNS.includes(over.id as Status)) {
      newStatus = over.id as Status
    } else {
      // Dropped on a card — find that card's column
      const overApp = applications.find((a) => a.id === over.id)
      if (overApp) newStatus = overApp.status
    }

    if (!newStatus || newStatus === draggedApp.status) return

    // Update UI immediately
    onUpdateLocal(draggedApp.id, newStatus)

    // Persist to DB in background
    fetch(`/api/applications/${draggedApp.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMNS.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            cards={getAppsByStatus(status)}
            colorClass={COLUMN_COLORS[status]}
            onRefetch={onRefetch}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApp && (
          <KanbanCard
            application={activeApp}
            onRefetch={onRefetch}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  )
}

type ColumnProps = {
  status: Status
  cards: Application[]
  colorClass: string
  onRefetch: () => void
}

function KanbanColumn({ status, cards, colorClass, onRefetch }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div className={`flex-shrink-0 w-64 bg-gray-50 rounded-xl border-t-4 ${colorClass} p-3`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          {STATUS_LABELS[status]}
        </h3>
        <span className="text-xs bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5">
          {cards.length}
        </span>
      </div>

      <SortableContext
        id={status}
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-32 rounded-lg transition-colors ${
            isOver ? "bg-indigo-50 ring-2 ring-indigo-200" : ""
          }`}
        >
          {cards.length === 0 && (
            <div className={`text-xs text-gray-400 text-center py-6 border-2 border-dashed rounded-lg transition-colors ${
              isOver ? "border-indigo-300 text-indigo-400" : "border-gray-200"
            }`}>
              Drop here
            </div>
          )}
          {cards.map((app) => (
            <KanbanCard key={app.id} application={app} onRefetch={onRefetch} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}

