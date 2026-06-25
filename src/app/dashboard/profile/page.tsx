"use client"

import { useEffect, useState, useRef } from "react"

type ProfileData = {
  name: string
  headline: string
  location: string
  age: string
  industry: string
  profile: string
}

const EMPTY_PROFILE: ProfileData = {
  name: "",
  headline: "",
  location: "",
  age: "",
  industry: "",
  profile: "",
}

export default function ProfilePage() {
  const [data, setData] = useState<ProfileData>(EMPTY_PROFILE)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<ProfileData>(EMPTY_PROFILE)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEmpty = !data.name && !data.headline && !data.profile

  useEffect(() => {
    let mounted = true
    const load = async () => {
      const res = await fetch("/api/profile")
      const json = await res.json()
      if (mounted) {
        const loaded = {
          name: json.name || "",
          headline: json.headline || "",
          location: json.location || "",
          age: json.age || "",
          industry: json.industry || "",
          profile: json.profile || "",
        }
        setData(loaded)
        setForm(loaded)
        setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setError("")
    const res = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    })
    if (!res.ok) {
      setError("Failed to save — please try again")
      setSaving(false)
      return
    }
    setData(form)
    setSaving(false)
    setEditing(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")

    const formData = new FormData()
    formData.append("resume", file)

    const res = await fetch("/api/profile/upload", {
      method: "POST",
      body: formData,
    })

    const json = await res.json()

    if (!res.ok) {
      setError(json.error || "Upload failed")
      setUploading(false)
      return
    }

    setForm((prev) => ({ ...prev, profile: json.profile }))
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  if (loading) {
    return <div className="bg-white rounded-xl p-6 animate-pulse h-64 max-w-2xl" />
  }

  // View mode
  if (!editing && !isEmpty) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <button
            onClick={() => setEditing(true)}
            className="text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2 rounded-xl font-medium transition-colors"
          >
            ✏️ Edit Profile
          </button>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Header card */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-white text-2xl">👤</span>
            </div>
            <h2 className="text-xl font-bold text-white">{data.name || "No name set"}</h2>
            {data.headline && (
              <p className="text-indigo-200 text-sm mt-1">{data.headline}</p>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-3 divide-x divide-gray-100 border-b border-gray-100">
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">Location</p>
              <p className="text-sm font-medium text-gray-900">{data.location || "—"}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">Age</p>
              <p className="text-sm font-medium text-gray-900">{data.age || "—"}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 mb-0.5">Industry</p>
              <p className="text-sm font-medium text-gray-900">{data.industry || "—"}</p>
            </div>
          </div>

          {/* Resume */}
          <div className="px-6 py-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Resume / Bio
            </p>
            {data.profile ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                {data.profile}
              </p>
            ) : (
              <p className="text-sm text-gray-400 italic">No resume added yet</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Edit / create mode
  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEmpty ? "Create Profile" : "Edit Profile"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            This info helps the AI personalize your cover letters and interview prep
          </p>
        </div>
        {!isEmpty && (
          <button
            onClick={() => { setForm(data); setEditing(false) }}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6 space-y-5">

        {/* Name + Headline */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Full Name</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Eric Merida"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Headline</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Full-Stack Developer"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </div>
        </div>

        {/* Location + Age + Industry */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Location</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="St. Petersburg, FL"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Age</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="28"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Industry</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Software Engineering"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
        </div>

        {/* Resume upload */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Resume
          </label>
          <p className="text-xs text-gray-400 mb-2">
            Upload a PDF to auto-extract your resume text, or type/paste it below
          </p>

          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all"
          >
            {uploading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
                <span className="text-sm text-indigo-600">Extracting text from PDF...</span>
              </div>
            ) : (
              <>
                <p className="text-2xl mb-1">📄</p>
                <p className="text-sm text-gray-600 font-medium">Click to upload PDF resume</p>
                <p className="text-xs text-gray-400 mt-0.5">Max 5MB</p>
              </>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* Resume text area */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1">
            Resume Text
          </label>
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Your resume text will appear here after upload, or paste it manually..."
            rows={10}
            value={form.profile}
            onChange={(e) => setForm({ ...form, profile: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">{form.profile.length} characters</p>
        </div>

        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </div>
    </div>
  )
}
