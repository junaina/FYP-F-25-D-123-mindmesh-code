// src/components/wiki/extensions/SlackEmbed.tsx
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";

type SlackEmbedAttrs = {
  embedId: string;

  workspace?: string;

  channelId: string;
  channelName: string;

  senderId: string;
  senderName: string;
  senderAvatar?: string;

  text: string;
  timestamp: string;
  permalink: string;
};

function SlackEmbedView(props: NodeViewProps) {
  const attrs = props.node.attrs as unknown as SlackEmbedAttrs;

  const shortTs = (() => {
    // Slack ts is like "1769867609.704739"
    const secs = Number(String(attrs.timestamp).split(".")[0]);
    if (!Number.isFinite(secs)) return attrs.timestamp;
    try {
      return new Date(secs * 1000).toLocaleString();
    } catch {
      return attrs.timestamp;
    }
  })();

  return (
    <NodeViewWrapper className="mm-slack-embed my-4">
      <div className="border rounded-lg bg-muted/40 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-3 py-2 border-b">
          <div className="min-w-0">
            <div className="text-sm font-medium truncate">
              Sent to <span className="underline">#{attrs.channelName}</span>
              {attrs.workspace ? (
                <span className="text-muted-foreground">
                  {" "}
                  • {attrs.workspace}
                </span>
              ) : null}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              by {attrs.senderName} • {shortTs}
            </div>
          </div>

          <a
            href={attrs.permalink}
            target="_blank"
            rel="noreferrer"
            className="text-xs px-2 py-1 rounded-md border bg-background hover:bg-muted shrink-0"
          >
            Open in Slack
          </a>
        </div>

        <div className="px-3 py-2 bg-background">
          <div className="text-sm whitespace-pre-wrap">{attrs.text}</div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const SlackEmbed = Node.create({
  name: "slackEmbed",

  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      embedId: { default: "" },

      workspace: { default: "" },

      channelId: { default: "" },
      channelName: { default: "" },

      senderId: { default: "" },
      senderName: { default: "" },
      senderAvatar: { default: null },

      text: { default: "" },
      timestamp: { default: "" },
      permalink: { default: "" },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='slack-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "slack-embed" }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SlackEmbedView);
  },
});
