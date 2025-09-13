-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."ProjectVisibility" AS ENUM ('PRIVATE', 'LINK', 'ORG');

-- CreateEnum
CREATE TYPE "public"."ProjectRole" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "public"."DocCollaboratorRole" AS ENUM ('VIEWER', 'COMMENTER', 'EDITOR');

-- CreateEnum
CREATE TYPE "public"."ThreadMode" AS ENUM ('ALL', 'MENTIONS', 'NONE');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "status" "public"."UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."OauthIdentity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OauthIdentity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Session" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "userAgent" TEXT,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Project" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "createdById" UUID NOT NULL,
    "visibility" "public"."ProjectVisibility" NOT NULL DEFAULT 'PRIVATE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectMember" (
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "public"."ProjectRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "public"."Invite" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "public"."ProjectRole" NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ProjectSettings" (
    "projectId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultThreadMode" "public"."ThreadMode" NOT NULL DEFAULT 'ALL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSettings_pkey" PRIMARY KEY ("projectId","userId")
);

-- CreateTable
CREATE TABLE "public"."GlobalUserPrefs" (
    "userId" UUID NOT NULL,
    "theme" TEXT NOT NULL DEFAULT 'system',
    "locale" TEXT DEFAULT 'en-US',
    "timezone" TEXT DEFAULT 'UTC',
    "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "defaultThreadMode" "public"."ThreadMode" NOT NULL DEFAULT 'ALL',
    "emailOptIn" BOOLEAN NOT NULL DEFAULT true,
    "dndStart" TEXT,
    "dndEnd" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GlobalUserPrefs_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "public"."Document" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "parentId" UUID,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentCollaborator" (
    "documentId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "public"."DocCollaboratorRole" NOT NULL DEFAULT 'VIEWER',
    "addedById" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentCollaborator_pkey" PRIMARY KEY ("documentId","userId")
);

-- CreateTable
CREATE TABLE "public"."File" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "uploaderId" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentFile" (
    "documentId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "DocumentFile_pkey" PRIMARY KEY ("documentId","fileId")
);

-- CreateTable
CREATE TABLE "public"."Embed" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "documentId" UUID,
    "kind" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyDefinition" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."PropertyOption" (
    "id" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "color" TEXT,

    CONSTRAINT "PropertyOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DocumentProperty" (
    "documentId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,

    CONSTRAINT "DocumentProperty_pkey" PRIMARY KEY ("documentId","propertyId")
);

-- CreateTable
CREATE TABLE "public"."Collection" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Collection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CollectionItem" (
    "collectionId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "position" INTEGER,
    "addedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("collectionId","documentId")
);

-- CreateTable
CREATE TABLE "public"."ViewPropertyVisibility" (
    "id" UUID NOT NULL,
    "collectionId" UUID NOT NULL,
    "propertyId" UUID NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ViewPropertyVisibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskBoard" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "hostDocumentId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskBoard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskBoardBindings" (
    "taskBoardId" UUID NOT NULL,
    "statusPropertyId" UUID NOT NULL,
    "assigneePropertyId" UUID NOT NULL,
    "duePropertyId" UUID NOT NULL,

    CONSTRAINT "TaskBoardBindings_pkey" PRIMARY KEY ("taskBoardId")
);

-- CreateTable
CREATE TABLE "public"."TaskBoardColumn" (
    "id" UUID NOT NULL,
    "taskBoardId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "TaskBoardColumn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."TaskBoardItem" (
    "taskBoardId" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "columnId" UUID NOT NULL,
    "position" INTEGER,
    "addedById" UUID NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskBoardItem_pkey" PRIMARY KEY ("taskBoardId","documentId")
);

-- CreateTable
CREATE TABLE "public"."Discussion" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Thread" (
    "id" UUID NOT NULL,
    "discussionId" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "description" TEXT,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Thread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ThreadMember" (
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" TEXT,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadMember_pkey" PRIMARY KEY ("threadId","userId")
);

-- CreateTable
CREATE TABLE "public"."ThreadUserPrefs" (
    "threadId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "mode" "public"."ThreadMode" NOT NULL DEFAULT 'ALL',
    "isMuted" BOOLEAN NOT NULL DEFAULT false,
    "lastReadAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ThreadUserPrefs_pkey" PRIMARY KEY ("threadId","userId")
);

-- CreateTable
CREATE TABLE "public"."Message" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "senderId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "bodyJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "editedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MessageMention" (
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "MessageMention_pkey" PRIMARY KEY ("messageId","userId")
);

-- CreateTable
CREATE TABLE "public"."MessageReaction" (
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageReaction_pkey" PRIMARY KEY ("messageId","userId","emoji")
);

-- CreateTable
CREATE TABLE "public"."MessageAttachment" (
    "messageId" UUID NOT NULL,
    "fileId" UUID NOT NULL,

    CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY ("messageId","fileId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "OauthIdentity_userId_idx" ON "public"."OauthIdentity"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OauthIdentity_provider_providerUserId_key" ON "public"."OauthIdentity"("provider", "providerUserId");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "public"."Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_slug_key" ON "public"."Project"("slug");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "public"."Project"("createdById");

-- CreateIndex
CREATE INDEX "ProjectMember_userId_idx" ON "public"."ProjectMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_token_key" ON "public"."Invite"("token");

-- CreateIndex
CREATE INDEX "Invite_projectId_idx" ON "public"."Invite"("projectId");

-- CreateIndex
CREATE INDEX "Invite_email_idx" ON "public"."Invite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_projectId_email_key" ON "public"."Invite"("projectId", "email");

-- CreateIndex
CREATE INDEX "Document_projectId_idx" ON "public"."Document"("projectId");

-- CreateIndex
CREATE INDEX "Document_parentId_idx" ON "public"."Document"("parentId");

-- CreateIndex
CREATE INDEX "Document_createdById_idx" ON "public"."Document"("createdById");

-- CreateIndex
CREATE INDEX "Document_projectId_createdAt_idx" ON "public"."Document"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "DocumentCollaborator_userId_idx" ON "public"."DocumentCollaborator"("userId");

-- CreateIndex
CREATE INDEX "DocumentCollaborator_addedById_idx" ON "public"."DocumentCollaborator"("addedById");

-- CreateIndex
CREATE INDEX "File_projectId_idx" ON "public"."File"("projectId");

-- CreateIndex
CREATE INDEX "File_uploaderId_idx" ON "public"."File"("uploaderId");

-- CreateIndex
CREATE INDEX "Embed_projectId_idx" ON "public"."Embed"("projectId");

-- CreateIndex
CREATE INDEX "Embed_documentId_idx" ON "public"."Embed"("documentId");

-- CreateIndex
CREATE INDEX "PropertyDefinition_projectId_idx" ON "public"."PropertyDefinition"("projectId");

-- CreateIndex
CREATE INDEX "PropertyOption_propertyId_idx" ON "public"."PropertyOption"("propertyId");

-- CreateIndex
CREATE UNIQUE INDEX "PropertyOption_propertyId_value_key" ON "public"."PropertyOption"("propertyId", "value");

-- CreateIndex
CREATE INDEX "Collection_documentId_idx" ON "public"."Collection"("documentId");

-- CreateIndex
CREATE INDEX "Collection_createdById_idx" ON "public"."Collection"("createdById");

-- CreateIndex
CREATE INDEX "CollectionItem_documentId_idx" ON "public"."CollectionItem"("documentId");

-- CreateIndex
CREATE INDEX "CollectionItem_addedById_idx" ON "public"."CollectionItem"("addedById");

-- CreateIndex
CREATE INDEX "ViewPropertyVisibility_collectionId_idx" ON "public"."ViewPropertyVisibility"("collectionId");

-- CreateIndex
CREATE INDEX "ViewPropertyVisibility_propertyId_idx" ON "public"."ViewPropertyVisibility"("propertyId");

-- CreateIndex
CREATE INDEX "TaskBoard_projectId_idx" ON "public"."TaskBoard"("projectId");

-- CreateIndex
CREATE INDEX "TaskBoard_hostDocumentId_idx" ON "public"."TaskBoard"("hostDocumentId");

-- CreateIndex
CREATE INDEX "TaskBoard_createdById_idx" ON "public"."TaskBoard"("createdById");

-- CreateIndex
CREATE INDEX "TaskBoardBindings_statusPropertyId_idx" ON "public"."TaskBoardBindings"("statusPropertyId");

-- CreateIndex
CREATE INDEX "TaskBoardBindings_assigneePropertyId_idx" ON "public"."TaskBoardBindings"("assigneePropertyId");

-- CreateIndex
CREATE INDEX "TaskBoardBindings_duePropertyId_idx" ON "public"."TaskBoardBindings"("duePropertyId");

-- CreateIndex
CREATE INDEX "TaskBoardColumn_taskBoardId_idx" ON "public"."TaskBoardColumn"("taskBoardId");

-- CreateIndex
CREATE INDEX "TaskBoardColumn_optionId_idx" ON "public"."TaskBoardColumn"("optionId");

-- CreateIndex
CREATE INDEX "TaskBoardItem_columnId_idx" ON "public"."TaskBoardItem"("columnId");

-- CreateIndex
CREATE INDEX "TaskBoardItem_addedById_idx" ON "public"."TaskBoardItem"("addedById");

-- CreateIndex
CREATE UNIQUE INDEX "Discussion_projectId_key" ON "public"."Discussion"("projectId");

-- CreateIndex
CREATE INDEX "Thread_discussionId_idx" ON "public"."Thread"("discussionId");

-- CreateIndex
CREATE INDEX "Thread_createdById_idx" ON "public"."Thread"("createdById");

-- CreateIndex
CREATE INDEX "ThreadMember_userId_idx" ON "public"."ThreadMember"("userId");

-- CreateIndex
CREATE INDEX "Message_threadId_idx" ON "public"."Message"("threadId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "public"."Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_threadId_createdAt_idx" ON "public"."Message"("threadId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."OauthIdentity" ADD CONSTRAINT "OauthIdentity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Invite" ADD CONSTRAINT "Invite_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectSettings" ADD CONSTRAINT "ProjectSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ProjectSettings" ADD CONSTRAINT "ProjectSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GlobalUserPrefs" ADD CONSTRAINT "GlobalUserPrefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Document" ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCollaborator" ADD CONSTRAINT "DocumentCollaborator_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCollaborator" ADD CONSTRAINT "DocumentCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentCollaborator" ADD CONSTRAINT "DocumentCollaborator_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."File" ADD CONSTRAINT "File_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFile" ADD CONSTRAINT "DocumentFile_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentFile" ADD CONSTRAINT "DocumentFile_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Embed" ADD CONSTRAINT "Embed_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Embed" ADD CONSTRAINT "Embed_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyDefinition" ADD CONSTRAINT "PropertyDefinition_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PropertyOption" ADD CONSTRAINT "PropertyOption_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentProperty" ADD CONSTRAINT "DocumentProperty_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DocumentProperty" ADD CONSTRAINT "DocumentProperty_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Collection" ADD CONSTRAINT "Collection_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionItem" ADD CONSTRAINT "CollectionItem_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionItem" ADD CONSTRAINT "CollectionItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CollectionItem" ADD CONSTRAINT "CollectionItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewPropertyVisibility" ADD CONSTRAINT "ViewPropertyVisibility_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "public"."Collection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ViewPropertyVisibility" ADD CONSTRAINT "ViewPropertyVisibility_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoard" ADD CONSTRAINT "TaskBoard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoard" ADD CONSTRAINT "TaskBoard_hostDocumentId_fkey" FOREIGN KEY ("hostDocumentId") REFERENCES "public"."Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoard" ADD CONSTRAINT "TaskBoard_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardBindings" ADD CONSTRAINT "TaskBoardBindings_taskBoardId_fkey" FOREIGN KEY ("taskBoardId") REFERENCES "public"."TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardBindings" ADD CONSTRAINT "TaskBoardBindings_statusPropertyId_fkey" FOREIGN KEY ("statusPropertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardBindings" ADD CONSTRAINT "TaskBoardBindings_assigneePropertyId_fkey" FOREIGN KEY ("assigneePropertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardBindings" ADD CONSTRAINT "TaskBoardBindings_duePropertyId_fkey" FOREIGN KEY ("duePropertyId") REFERENCES "public"."PropertyDefinition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardColumn" ADD CONSTRAINT "TaskBoardColumn_taskBoardId_fkey" FOREIGN KEY ("taskBoardId") REFERENCES "public"."TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardColumn" ADD CONSTRAINT "TaskBoardColumn_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "public"."PropertyOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardItem" ADD CONSTRAINT "TaskBoardItem_taskBoardId_fkey" FOREIGN KEY ("taskBoardId") REFERENCES "public"."TaskBoard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardItem" ADD CONSTRAINT "TaskBoardItem_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "public"."Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardItem" ADD CONSTRAINT "TaskBoardItem_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "public"."TaskBoardColumn"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."TaskBoardItem" ADD CONSTRAINT "TaskBoardItem_addedById_fkey" FOREIGN KEY ("addedById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Discussion" ADD CONSTRAINT "Discussion_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Thread" ADD CONSTRAINT "Thread_discussionId_fkey" FOREIGN KEY ("discussionId") REFERENCES "public"."Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Thread" ADD CONSTRAINT "Thread_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThreadMember" ADD CONSTRAINT "ThreadMember_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThreadMember" ADD CONSTRAINT "ThreadMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThreadUserPrefs" ADD CONSTRAINT "ThreadUserPrefs_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ThreadUserPrefs" ADD CONSTRAINT "ThreadUserPrefs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "public"."Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageMention" ADD CONSTRAINT "MessageMention_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageMention" ADD CONSTRAINT "MessageMention_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageReaction" ADD CONSTRAINT "MessageReaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "public"."Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MessageAttachment" ADD CONSTRAINT "MessageAttachment_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "public"."File"("id") ON DELETE CASCADE ON UPDATE CASCADE;
