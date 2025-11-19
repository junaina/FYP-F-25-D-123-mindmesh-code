// src/components/wiki/extensions/GoogleDriveEmbed.tsx
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  type NodeViewProps,
} from "@tiptap/react";

type GoogleDriveAttrs = {
  embedId: string;
  name: string;
  previewLink: string;
  webViewLink: string;
};

function GoogleDriveEmbedView(props: NodeViewProps) {
  // attrs coming from TipTap doc JSON
  const attrs = props.node.attrs as unknown as GoogleDriveAttrs;
  const { name, previewLink, webViewLink } = attrs;

  return (
    <NodeViewWrapper className="mm-gdrive-embed my-4">
      <div className="border rounded-lg overflow-hidden bg-muted/40">
        <div className="flex items-center justify-between px-3 py-2 border-b text-sm">
          <span className="font-medium truncate">{name}</span>
          {webViewLink && (
            <a
              href={webViewLink}
              target="_blank"
              rel="noreferrer"
              className="text-xs underline"
            >
              Open in Drive
            </a>
          )}
        </div>
        <div className="bg-background">
          {previewLink ? (
            <iframe
              src={previewLink}
              className="w-full min-h-[320px] max-h-[640px] border-0"
              allow="autoplay"
            />
          ) : (
            <div className="p-4 text-xs text-muted-foreground">
              No preview link configured
            </div>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
}

export const GoogleDriveEmbed = Node.create({
  name: "googleDriveEmbed",

  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      embedId: {
        default: "",
      },
      name: {
        default: "Google Drive file",
      },
      previewLink: {
        default: "",
      },
      webViewLink: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-type='google-drive-embed']" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "google-drive-embed",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(GoogleDriveEmbedView);
  },
});
