import { getServerSession } from "next-auth"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      name: true,
      location: true,
      age: true,
      industry: true,
      headline: true,
      profile: true,
    },
  })

  return NextResponse.json(user)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { name, location, age, industry, headline, profile } = await req.json()

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name, location, age, industry, headline, profile },
  })

  return NextResponse.json(user)
}