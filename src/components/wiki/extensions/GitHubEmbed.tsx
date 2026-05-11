// src/components/wiki/extensions/GitHubEmbed.tsx
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";
import { useMemo, useState } from "react";
import type {
  GitHubIssueMeta,
  GitHubPRMeta,
} from "@/modules/documents/domain/embed.types";
import { refreshGitHubEmbed } from "@/modules/documents/client/githubEmbeds.api";

type GitHubAttrs = {
  embedId: string;

  // meta fields (we store these directly on the node attrs for instant render)
  type: "pr" | "issue";
  owner: string;
  repo: string;
  number: number;
  title: string;
  author: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  merged?: boolean;
  updatedAt: string;
  htmlUrl: string;
};

function getDocCtxFromEditor(props: NodeViewProps) {
  const dom = props.editor?.view?.dom as HTMLElement | undefined;
  const host = dom?.closest?.(
    "[data-project-id][data-doc-id]",
  ) as HTMLElement | null;

  const projectId = host?.dataset?.projectId;
  const docId = host?.dataset?.docId;

  if (!projectId || !docId) return null;
  return { projectId, docId };
}

function GitHubEmbedView(props: NodeViewProps) {
  const attrs = props.node.attrs as unknown as GitHubAttrs;

  const [refreshing, setRefreshing] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const repoLine = useMemo(
    () => `${attrs.owner}/${attrs.repo} #${attrs.number}`,
    [attrs.owner, attrs.repo, attrs.number],
  );

  const stateLabel = attrs.state;
  const updatedShort = useMemo(() => {
    try {
      return new Date(attrs.updatedAt).toLocaleString();
    } catch {
      return attrs.updatedAt;
    }
  }, [attrs.updatedAt]);

  const onRefresh = async () => {
    const ctx = getDocCtxFromEditor(props);
    if (!ctx) {
      setErrMsg("Missing doc context (project/doc id).");
      return;
    }

    try {
      setErrMsg(null);
      setRefreshing(true);

      const meta = await refreshGitHubEmbed({
        projectId: ctx.projectId,
        docId: ctx.docId,
        embedId: attrs.embedId,
      });

      // update node attrs from returned meta
      props.updateAttributes({
        ...meta,
        state: (meta as GitHubPRMeta).state ?? (meta as GitHubIssueMeta).state,
      });
    } catch (e: any) {
      if (e?.code === "GITHUB_NOT_CONNECTED") {
        setErrMsg("GitHub not connected. Reconnect to refresh.");
      } else {
        setErrMsg("Refresh failed.");
      }
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <NodeViewWrapper className="mm-github-embed my-4">
      <div className="border rounded-lg bg-muted/40 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-3 py-2 border-b">
          <div className="min-w-0">
            <a
              href={attrs.htmlUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium underline truncate block"
              title={repoLine}
            >
              {repoLine}
            </a>
            <div className="text-xs text-muted-foreground truncate">
              by {attrs.author} • updated {updatedShort}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full border bg-background">
              {stateLabel}
            </span>
            <button
              className="text-xs px-2 py-1 rounded-md border bg-background hover:bg-muted"
              onClick={onRefresh}
              disabled={refreshing}
              type="button"
            >
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="px-3 py-2 bg-background">
          <div className="text-sm">{attrs.title}</div>
          {errMsg && (
            <div className="mt-2 text-xs text-destructive">{errMsg}</div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const GitHubEmbed = Node.create({
  name: "githubEmbed",

  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      embedId: { default: "" },

      type: { default: "pr" },
      owner: { default: "" },
      repo: { default: "" },
      number: { default: 0 },
      title: { default: "" },
      author: { default: "" },
      state: { default: "OPEN" },
      merged: { default: false },
      updatedAt: { default: "" },
      htmlUrl: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='github-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "github-embed",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GitHubEmbedView);
  },
});
