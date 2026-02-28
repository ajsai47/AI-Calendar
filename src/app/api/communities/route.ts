import { NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db } from "@/server/db";
import { communities } from "@/server/db/schema";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour ISR cache

export async function GET() {
  const rows = await db
    .select()
    .from(communities)
    .orderBy(asc(communities.name));

  return NextResponse.json({ communities: rows });
}
