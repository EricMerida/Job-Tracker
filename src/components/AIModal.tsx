"use client"

import { useState, useRef } from "react"
import { Application } from "@/app/dashboard/page"

type Props = {
  application: Application
  onClose: () => void
}

type AIMode = "cover-letter" | "interview-prep"

export default function AIModal({ application, onClose }: Props) {
  const [mode, setMode] = useState<AIMode>("cover-letter")
  const [jobDescription, setJobDescription] = useState("")
  const [language, setLanguage] = useState<"en" | "es">("en")
  const [output, setOutput] = useState("")
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)

  const handleGenerate = async () => {
    setLoading(true)
    setOutput("")

    const endpoint =
      mode === "cover-letter"
        ? "/api/ai/cover-letter"
        : "/api/ai/interview-prep"

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: application.company,
        role: application.role,
        jobDescription,
        language,
      }),
    })

    if (!res.ok || !res.body) {
      setOutput("Something went wrong. Please try again.")
      setLoading(false)
      return
    }

    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      setOutput((prev) => prev + text)
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight
      }
    }

    setLoading(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">AI Assistant</h2>
            <p className="text-sm text-gray-500">
              {application.role} at {application.company}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setMode("cover-letter"); setOutput("") }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === "cover-letter"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            ✉️ Cover Letter
          </button>
          <button
            onClick={() => { setMode("interview-prep"); setOutput("") }}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
              mode === "interview-prep"
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            🎯 Interview Prep
          </button>
        </div>

        {/* Language toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setLanguage("en")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              language === "en"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            🇺🇸 English
          </button>
          <button
            onClick={() => setLanguage("es")}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              language === "es"
                ? "bg-indigo-100 text-indigo-700"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            🇪🇸 Español
          </button>
        </div>

        {/* Job description input — only for cover letter */}
        {mode === "cover-letter" && (
          <textarea
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none mb-4"
            placeholder="Paste the job description here (optional but recommended)..."
            rows={3}
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        )}

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 mb-4"
        >
          {loading ? "Generating..." : `Generate ${mode === "cover-letter" ? "Cover Letter" : "Interview Questions"}`}
        </button>

        {/* Output */}
        {output && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-700">Output</p>
              <button
                onClick={handleCopy}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
            <div
              ref={outputRef}
              className="flex-1 bg-gray-50 rounded-xl p-4 text-sm text-gray-800 overflow-y-auto whitespace-pre-wrap max-h-64"
            >
              {output}
              {loading && (
                <span className="inline-block w-1.5 h-4 bg-indigo-500 animate-pulse ml-0.5" />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}