import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  company: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  status: z.enum(["APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"]).optional(),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().optional(),
  followUpDate: z.string().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const application = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const body = await req.json()
  const parsed = updateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updated = await prisma.application.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      followUpDate: parsed.data.followUpDate
        ? new Date(parsed.data.followUpDate)
        : undefined,
      jobUrl: parsed.data.jobUrl || null,
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  })

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  const application = await prisma.application.findFirst({
    where: { id: params.id, userId: user.id },
  })

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  await prisma.application.delete({ where: { id: params.id } })

  return NextResponse.json({ success: true })
}
