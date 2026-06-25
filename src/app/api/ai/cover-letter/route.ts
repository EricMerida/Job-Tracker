import Anthropic from "@anthropic-ai/sdk"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { profile: true },
  })

  const { company, role, jobDescription, language } = await req.json()

  if (!company || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const profileContext = user?.profile
    ? `Here is the candidate's background:\n${user.profile}\n\n`
    : ""

  const prompt =
    language === "es"
      ? `${profileContext}Escribe una carta de presentación profesional en español para el puesto de ${role} en ${company}. ${jobDescription ? `Descripción del trabajo: ${jobDescription}` : ""} La carta debe ser profesional, concisa y de no más de 3 párrafos. Usa la información del candidato para personalizarla.`
      : `${profileContext}Write a professional cover letter for the ${role} position at ${company}. ${jobDescription ? `Job description: ${jobDescription}` : ""} The letter should be professional, concise, and no more than 3 paragraphs. Address it as "Dear Hiring Manager". Use the candidate's background to personalize it.`

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1000,
    messages: [{ role: "user", content: prompt }],
  })

  const encoder = new TextEncoder()

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          controller.enqueue(encoder.encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  })
}
