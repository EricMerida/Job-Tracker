import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { extractText } from "unpdf"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("resume") as File

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 })
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 })
    }

    const buffer = await file.arrayBuffer()
    const { text } = await extractText(new Uint8Array(buffer), { mergePages: true })
    const extractedText = Array.isArray(text) ? text.join("\n") : text

    if (!extractedText?.trim()) {
      return NextResponse.json({ error: "Could not extract text from PDF" }, { status: 400 })
    }

    await prisma.user.update({
      where: { email: session.user.email },
      data: { profile: extractedText.trim() },
    })

    return NextResponse.json({ profile: extractedText.trim() })
  } catch (err) {
    console.error("PDF upload error:", err)
    return NextResponse.json({ error: "Failed to process PDF" }, { status: 500 })
  }
}

