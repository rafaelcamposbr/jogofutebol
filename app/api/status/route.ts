import { NextResponse } from "next/server";
import { getStatusData } from "@/lib/status";

export async function GET() {
  return NextResponse.json(await getStatusData());
}
