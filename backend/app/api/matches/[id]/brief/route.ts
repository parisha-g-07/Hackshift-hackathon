import { NextRequest, NextResponse } from "next/server";
import { getOrGenerateConnectionBrief } from "@/lib/ai/brief";
import { localStore } from "@/lib/data/store";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: alumId } = await params;
  const { searchParams } = new URL(req.url);
  const intentId = searchParams.get("intentId") || "";

  const alum = localStore.profiles.find((p) => p.id === alumId);
  const intent = localStore.intents.find((i) => i.id === intentId) || localStore.intents[0];

  if (!alum) {
    return NextResponse.json({ error: "Alumnus not found" }, { status: 404 });
  }

  const briefResult = await getOrGenerateConnectionBrief({
    studentId: intent?.user_id || "demo-student",
    alumId: alum.id,
    intentId: intent?.id || "demo-intent",
    studentGoal: intent?.title || "Career guidance and mentorship",
    helpTypeRequested: "Mock Interview",
    alumniName: alum.full_name,
    alumniRole: alum.job_title || undefined,
    alumniCompany: alum.company || undefined,
    alumniDomains: ["Product Management", "Technology"],
  });

  return NextResponse.json(briefResult);
}
