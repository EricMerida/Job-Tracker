import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const applicationSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["APPLIED", "PHONE_SCREEN", "INTERVIEW", "OFFER", "REJECTED"]),
  location: z.string().optional(),
  salary: z.string().optional(),
  jobUrl: z.string().url().optional().or(z.literal("")),
  followUpDate: z.string().optional(),
  appliedDate: z.string().optional(),
})

export async function GET() {
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

  const applications = await prisma.application.findMany({
    where: { userId: user.id },
    include: { notes: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(applications)
}

export async function POST(req: NextRequest) {
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

  const body = await req.json()
  const parsed = applicationSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const application = await prisma.application.create({
    data: {
      ...parsed.data,
      userId: user.id,
      followUpDate: parsed.data.followUpDate
        ? new Date(parsed.data.followUpDate)
        : null,
      appliedDate: parsed.data.appliedDate
        ? new Date(parsed.data.appliedDate)
        : new Date(),
      jobUrl: parsed.data.jobUrl || null,
    },
  })

  return NextResponse.json(application, { status: 201 })
}