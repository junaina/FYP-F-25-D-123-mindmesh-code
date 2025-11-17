import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/auth/session";
import * as AuthService from "@/modules/auth/service/auth.service";
import { projectService } from "@/modules/projects/service/project.service";

export default async function AcceptInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;

  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value;

  if (!sessionId) {
    // redirect to login and then back to this page
    redirect(`/login?next=/invites/${token}`);
  }

  const me = await AuthService.getMeFromSessionId(sessionId!);
  if (!me) {
    redirect(`/login?next=/invites/${token}`);
  }

  try {
    const result = await projectService.acceptInviteForUser(
      me.id,
      me.email,
      token
    );
    redirect(`/projects/${result.projectId}`);
  } catch (err: any) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-6 border rounded-lg shadow-sm">
          <h1 className="text-xl font-semibold mb-2">
            Unable to accept invite
          </h1>
          <p className="text-sm text-muted-foreground">
            {err?.message ?? "This invite is invalid or expired."}
          </p>
        </div>
      </div>
    );
  }
}
