"use client"

import { useEffect, useState } from "react"
import { Application, Status, STATUS_LABELS } from "@/app/dashboard/page"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const STATUS_CHART_COLORS: Record<Status, string> = {
  APPLIED: "#60a5fa",
  PHONE_SCREEN: "#fbbf24",
  INTERVIEW: "#a78bfa",
  OFFER: "#34d399",
  REJECTED: "#f87171",
}

export default function StatsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)

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
    return () => { mounted = false }
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl p-6 animate-pulse h-32" />
        ))}
      </div>
    )
  }

  // Calculate stats
  const total = applications.length
  const offers = applications.filter((a) => a.status === "OFFER").length
  const interviews = applications.filter((a) => a.status === "INTERVIEW" || a.status === "OFFER").length
  const phoneScreens = applications.filter((a) => a.status !== "APPLIED" && a.status !== "REJECTED").length
  const responseRate = total > 0 ? Math.round((phoneScreens / total) * 100) : 0
  const interviewRate = total > 0 ? Math.round((interviews / total) * 100) : 0
  const offerRate = total > 0 ? Math.round((offers / total) * 100) : 0

  // Pie chart data
  const pieData = (Object.keys(STATUS_LABELS) as Status[])
    .map((status) => ({
      name: STATUS_LABELS[status],
      value: applications.filter((a) => a.status === status).length,
      color: STATUS_CHART_COLORS[status],
    }))
    .filter((d) => d.value > 0)

  // Line chart data — applications per day over last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (29 - i))
    return date.toISOString().split("T")[0]
  })

  const lineData = last30Days.map((date) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    applications: applications.filter(
      (a) => a.appliedDate.split("T")[0] === date
    ).length,
  }))

  // Only show every 5th label on x axis to avoid crowding
  const formatXAxis = (value: string, index: number) => {
    return index % 5 === 0 ? value : ""
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Stats</h1>
        <p className="text-gray-500 text-sm mt-1">Your job search at a glance</p>
      </div>

      {total === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-gray-500">Add some applications to see your stats</p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard label="Total Applied" value={total} color="text-blue-600" />
            <StatCard label="Response Rate" value={`${responseRate}%`} color="text-yellow-600" />
            <StatCard label="Interview Rate" value={`${interviewRate}%`} color="text-purple-600" />
            <StatCard label="Offer Rate" value={`${offerRate}%`} color="text-green-600" />
          </div>

          {/* Line chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Applications Over Time (Last 30 Days)
            </h2>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatXAxis}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="applications"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={{ fill: "#6366f1", r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Applications by Status
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Status breakdown table */}
          <div className="bg-white rounded-xl p-6 border border-gray-100">
            <h2 className="text-base font-semibold text-gray-900 mb-4">
              Breakdown
            </h2>
            <div className="space-y-3">
              {(Object.keys(STATUS_LABELS) as Status[]).map((status) => {
                const count = applications.filter((a) => a.status === status).length
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-gray-500 flex-shrink-0">
                      {STATUS_LABELS[status]}
                    </div>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: STATUS_CHART_COLORS[status],
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 w-12 text-right flex-shrink-0">
                      {count} ({pct}%)
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

type StatCardProps = {
  label: string
  value: string | number
  color: string
}

function StatCard({ label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-gray-100">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
    </div>
  )
}
