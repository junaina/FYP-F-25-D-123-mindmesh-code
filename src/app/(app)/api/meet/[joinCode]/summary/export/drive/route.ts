// src/app/(app)/api/meet/[joinCode]/summary/export/drive/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { getMeFromSessionId } from "@/modules/auth/service/auth.service";
import { MeetingSummaryDriveExportService } from "@/modules/integrations/googleDrive/services/meetingSummaryDriveExport.service";

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

    // For now, FE can send mock summary/actionItems in body.
    // Later: you’ll swap this to fetch from DB or call your Python inference service.
    const body = await req.json().catch(() => null);
    const summary = (body?.summary ?? "") as string;
    const actionItems = (body?.actionItems ?? []) as string[];

    const result = await MeetingSummaryDriveExportService.startExportToDrive({
      userId: me.id,
      joinCode,
      summary,
      actionItems,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("Summary Drive export error", err);
    return NextResponse.json(
      { error: "Failed to export meeting summary to Google Drive" },
      { status: 500 },
    );
  }
}
