import { RenameProjectInput } from "../dto/project.dto";
import { projectRepo, type ProjectLite } from "../repo/project.repo";
import { ProjectRole } from "@/generated/prisma"; // correct import
import crypto from "crypto";

// ADDED: Import Nodemailer transporter + ENV constants
import {
  transporter,
  INVITE_FROM_EMAIL,
  APP_URL,
} from "@/lib/email/nodemailer"; // <-- NEW IMPORT

export type CreateProjectInput = {
  name: string;
  visibility?: "PRIVATE" | "LINK" | "ORG";
};

export const projectService = {
  listForSidebar: (userId: string): Promise<ProjectLite[]> => {
    return projectRepo.listForUser(userId);
  },

  createForUser: async (
    userId: string,
    data: CreateProjectInput
  ): Promise<ProjectLite> => {
    const name = data.name?.trim();
    if (!name) throw new Error("Project name is required");

    const visibility = data.visibility ?? "PRIVATE";

    return projectRepo.createProjectWithOwner({
      name,
      visibility,
      createdById: userId,
    });
  },

  renameForUser: async (
    userId: string,
    projectId: string,
    input: RenameProjectInput
  ): Promise<ProjectLite> => {
    const name = input.name.trim();
    if (!name) throw new Error("Project name is required");

    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role || (role !== "OWNER" && role !== "ADMIN")) {
      const err = new Error("You do not have permission to rename this project");
      (err as any).status = 403;
      throw err;
    }

    return projectRepo.rename({ projectId, name });
  },

  deleteForUser: async (
    userId: string,
    projectId: string
  ): Promise<{ id: string }> => {
    const role = await projectRepo.getMemberRole(projectId, userId);
    if (!role || (role !== "OWNER" && role !== "ADMIN")) {
      const err: any = new Error(
        "You do not have permission to delete this project"
      );
      err.status = 403;
      throw err;
    }

    return projectRepo.deleteById(projectId);
  },

  // --------------------------------------------------------
  // INVITES
  // --------------------------------------------------------
  createInviteForUser: async (
    inviterId: string,
    projectId: string,
    email: string,
    role: ProjectRole = "MEMBER"
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) throw new Error("Email is required");

    // Permission check
    const inviterRole = await projectRepo.getMemberRole(projectId, inviterId);
    if (!inviterRole || (inviterRole !== "OWNER" && inviterRole !== "ADMIN")) {
      const err: any = new Error(
        "You do not have permission to invite members to this project"
      );
      err.status = 403;
      throw err;
    }

    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await projectRepo.createInvite({
      projectId,
      email: trimmedEmail,
      role,
      token,
      expiresAt,
    });

    // Email accept link
    const acceptUrl = `${APP_URL}/invites/${invite.token}`;

    // --------------------------------------------------------
    // CHANGED: Replaced Resend with Nodemailer
    // --------------------------------------------------------
    await transporter.sendMail({
      from: INVITE_FROM_EMAIL, // who the email appears from
      to: invite.email, // recipient
      subject: "You’ve been invited to a project",
      html: `
        <div style="font-family: system-ui, Arial, sans-serif;">
          <h2>You’ve been invited to join a project</h2>
          <p>You have been invited to join the project <strong>${invite.projectId}</strong>.</p>
          
          <p>Click the button below to accept:</p>

          <p>
            <a href="${acceptUrl}"
              style="display:inline-block;padding:10px 16px;background:#111827;color:#ffffff;
              text-decoration:none;border-radius:6px;font-weight:600;">
              Accept invitation
            </a>
          </p>

          <p>Or copy this link into your browser:</p>
          <p><a href="${acceptUrl}">${acceptUrl}</a></p>

          <p>This link expires in 7 days.</p>
        </div>
      `,
    });

    return invite;
  },

  // --------------------------------------------------------
  // ACCEPT INVITE
  // --------------------------------------------------------
  acceptInviteForUser: async (userId: string, userEmail: string, token: string) => {
    const invite = await projectRepo.getInviteByToken(token);
    if (!invite) {
      const err: any = new Error("Invite not found");
      err.status = 404;
      throw err;
    }

    if (invite.acceptedAt) {
      const err: any = new Error("Invite has already been accepted");
      err.status = 400;
      throw err;
    }

    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      const err: any = new Error("Invite has expired");
      err.status = 400;
      throw err;
    }

    // Email check
    if (invite.email.toLowerCase() !== userEmail.trim().toLowerCase()) {
      const err: any = new Error("This invite is for a different email address");
      err.status = 403;
      throw err;
    }

    // Add user to project
    await projectRepo.addMemberToProject({
      projectId: invite.projectId,
      userId,
      role: invite.role,
    });

    // Mark accepted
    await projectRepo.markInviteAccepted(invite.id);

    return { projectId: invite.projectId };
  },
};
