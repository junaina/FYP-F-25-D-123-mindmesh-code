// src/app/(app)/api/meet/[joinCode]/export/drive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { MeetingDriveExportService } from "@/modules/integrations/googleDrive/services/meetingDriveExport.service";

type RouteContext = {
  params: Promise<{ joinCode: string }>;
};

export async function POST(req: NextRequest, ctx: RouteContext) {
  try {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value;
    if (!sessionId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const me = await getMeFromSessionId(sessionId);
    if (!me) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { joinCode } = await ctx.params;

    const result = await MeetingDriveExportService.startExportToDrive({
      userId: me.id,
      joinCode,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Drive export error", {
      message: err instanceof Error ? err.message : "Unknown error",
      data:err instanceof Error ? err.stack : null,
    });
    return NextResponse.json(
      { error: "Failed to export transcript to Google Drive" },
      { status: 500 }
    );
  }
}
