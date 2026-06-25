import Anthropic from "@anthropic-ai/sdk"
import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { company, role, language } = await req.json()

  if (!company || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const prompt =
    language === "es"
      ? `Soy candidato para el puesto de ${role} en ${company}. Dame 8 preguntas de entrevista probables con consejos breves sobre cómo responder cada una. Formatea como una lista numerada.`
      : `I am interviewing for a ${role} position at ${company}. Give me 8 likely interview questions with brief tips on how to answer each one. Format as a numbered list with the question bold and the tip on the next line.`

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