// TimelineViewNode.tsx
import type { NodeViewProps } from "@tiptap/core";
import { View } from "@/components/timeline/grid/TimeScale";
import TimelineView from "@/components/timeline/TimelineView";
import { patchDocContent } from "@/modules/documents/client/docs.api";
import { NodeViewWrapper } from "@tiptap/react";
type OwnProps = { projectId: string; docId: string };
type Props = OwnProps & NodeViewProps;

export default function TimelineViewNode(props: Props) {
  const { node, editor, updateAttributes } = props;
  const { projectId, docId } = props;
  const { collectionId, view, start } = node.attrs as {
    collectionId: string;
    view: View;
    start: string;
  };

  async function handleChange(nextView: View, nextStartISO: string) {
    // 1) update the node attributes in the doc
    updateAttributes({ view: nextView, start: nextStartISO });

    // 2) persist the whole doc content (so refreshes reflect the change)
    await patchDocContent(projectId, docId, { content: editor.getJSON() });
  }

  return (
    <NodeViewWrapper className="my-3">
      <TimelineView
        projectId={projectId}
        docId={docId}
        collectionId={collectionId}
        view={view}
        start={start}
        onChangeViewAndStart={handleChange} // ✅ wire it
      />
    </NodeViewWrapper>
  );
}
