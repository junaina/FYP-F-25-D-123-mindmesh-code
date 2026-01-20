import { Node, mergeAttributes, CommandProps } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import TableViewNode from "@/components/wiki/extensions/kov/TableView/TableViewNode";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    tableView: {
      insertTableView: (opts: { collectionId: string }) => ReturnType;
    };
  }
}

export function TableViewExtension(opts: { projectId: string; docId: string }) {
  return Node.create({
    name: "tableView",
    group: "block",
    atom: true,
    selectable: true,
    draggable: false,

    addAttributes() {
      return {
        collectionId: { default: null },
      };
    },
    parseHTML() {
      return [{ tag: "table-view" }];
    },
    renderHTML({ HTMLAttributes }) {
      return ["table-view", mergeAttributes(HTMLAttributes)];
    },
    addNodeView() {
      console.log("[tableView] addNodeView called");
      return ReactNodeViewRenderer((props: any) => (
        <TableViewNode
          projectId={opts.projectId}
          docId={opts.docId}
          collectionId={props.node.attrs.collectionId}
        />
      ));
    },
    addCommands() {
      return {
        insertTableView:
          ({ collectionId }: { collectionId: string }) =>
          ({ chain }) => {
            // Insert as two sibling blocks at the current block depth:
            // 1) the tableView atom
            // 2) a paragraph so the caret has somewhere to go
            return chain()
              .focus()
              .insertContent([
                { type: this.name, attrs: { collectionId } },
                { type: "paragraph" },
              ])
              .run();
          },
      };
    },
  });
}
