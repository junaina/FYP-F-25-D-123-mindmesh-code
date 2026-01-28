# python-summarizer/rag/tiptap_to_text.py
from __future__ import annotations
from typing import Any, Dict, List, Optional

def tiptap_to_text(node: Optional[Dict[str, Any]]) -> str:
    if not node:
        return ""

    out: List[str] = []
    _walk(node, out, indent=0, ordered_index=1)
    text = "\n".join(_postprocess_lines(out))
    return text.strip()

def _walk(node: Dict[str, Any], out: List[str], indent: int, ordered_index: int) -> int:
    t = node.get("type")

    # Text
    if t == "text":
        txt = node.get("text") or ""
        if txt:
            out.append(txt)
        return ordered_index

    # Hard breaks / rules
    if t == "hardBreak":
        out.append("\n")
        return ordered_index
    if t == "horizontalRule":
        out.append("\n---\n")
        return ordered_index

    # Headings
    if t == "heading":
        level = ((node.get("attrs") or {}).get("level") or 1)
        prefix = "#" * max(1, min(6, int(level)))
        line = f"{prefix} {_inline_children(node)}"
        out.append(line.strip())
        out.append("")  # spacer
        return ordered_index

    # Paragraph
    if t == "paragraph":
        line = _inline_children(node)
        if line.strip():
            out.append((" " * indent) + line.strip())
        out.append("")  # spacer
        return ordered_index

    # Blockquote
    if t == "blockquote":
        inner = _block_children_text(node, indent=indent)
        if inner.strip():
            for ln in inner.splitlines():
                out.append((" " * indent) + f"> {ln}".rstrip())
        out.append("")
        return ordered_index

    # Code block
    if t == "codeBlock":
        inner = _inline_children(node)
        if inner.strip():
            out.append((" " * indent) + "```")
            out.append((" " * indent) + inner)
            out.append((" " * indent) + "```")
            out.append("")
        return ordered_index

    # Lists
    if t == "bulletList":
        for child in node.get("content") or []:
            ordered_index = _walk(child, out, indent=indent, ordered_index=ordered_index)
        out.append("")
        return ordered_index

    if t == "orderedList":
        # Reset numbering per ordered list
        idx = 1
        for child in node.get("content") or []:
            idx_before = idx
            idx = _walk(child, out, indent=indent, ordered_index=idx)
            # if listItem didn't increment, force it
            if idx == idx_before:
                idx += 1
        out.append("")
        return ordered_index

    if t == "listItem":
        # listItem usually contains paragraphs; treat first line specially
        prefix = (" " * indent) + "- "
        inner_lines = _block_children_lines(node, indent=indent + 2)
        if inner_lines:
            out.append(prefix + inner_lines[0].lstrip())
            for ln in inner_lines[1:]:
                out.append((" " * (indent + 2)) + ln.lstrip())
        return ordered_index

    if t == "taskList":
        for child in node.get("content") or []:
            ordered_index = _walk(child, out, indent=indent, ordered_index=ordered_index)
        out.append("")
        return ordered_index

    if t == "taskItem":
        checked = ((node.get("attrs") or {}).get("checked") is True)
        mark = "[x]" if checked else "[ ]"
        inner = _inline_children(node).strip()
        if inner:
            out.append((" " * indent) + f"- {mark} {inner}")
        return ordered_index

    # Toggle (summary + body)
    if t == "toggle":
        parts = node.get("content") or []
        summary = ""
        body = ""
        for p in parts:
            if p.get("type") == "toggleSummary":
                summary = _inline_children(p).strip()
            elif p.get("type") == "toggleBody":
                body = _block_children_text(p, indent=indent + 2).strip()

        if summary:
            out.append((" " * indent) + f"▶ {summary}")
        if body:
            for ln in body.splitlines():
                out.append((" " * (indent + 2)) + ln)
        out.append("")
        return ordered_index

    # Collection views (we can’t expand them in Goal 2, but we should not lose them)
    if t in ("tableView", "timelineView", "calendarView", "boardView"):
        attrs = node.get("attrs") or {}
        cid = attrs.get("collectionId")
        view = attrs.get("view")
        start = attrs.get("start")
        label = f"[{t}] collectionId={cid}"
        if view: label += f" view={view}"
        if start: label += f" start={start}"
        out.append((" " * indent) + label)
        out.append("")
        return ordered_index

    # Google Drive embed placeholder
    if t == "googleDriveEmbed":
        attrs = node.get("attrs") or {}
        name = attrs.get("name") or "Google Drive file"
        link = attrs.get("webViewLink") or attrs.get("previewLink")
        if link:
            out.append((" " * indent) + f"[Embedded file] {name} ({link})")
        else:
            out.append((" " * indent) + f"[Embedded file] {name}")
        out.append("")
        return ordered_index

    # Image placeholder
    if t == "image":
        attrs = node.get("attrs") or {}
        alt = attrs.get("alt") or attrs.get("title") or "image"
        out.append((" " * indent) + f"[Image] {alt}")
        out.append("")
        return ordered_index

    # Fallback: walk children
    for child in node.get("content") or []:
        ordered_index = _walk(child, out, indent=indent, ordered_index=ordered_index)
    return ordered_index

def _inline_children(node: Dict[str, Any]) -> str:
    # join text from nested children without forcing line breaks
    parts: List[str] = []
    for child in node.get("content") or []:
        if child.get("type") == "text":
            parts.append(child.get("text") or "")
        else:
            # recurse but flatten
            parts.append(_inline_children(child))
    return "".join(parts)

def _block_children_text(node: Dict[str, Any], indent: int) -> str:
    tmp: List[str] = []
    idx = 1
    for child in node.get("content") or []:
        idx = _walk(child, tmp, indent=indent, ordered_index=idx)
    return "\n".join(_postprocess_lines(tmp)).strip()

def _block_children_lines(node: Dict[str, Any], indent: int) -> List[str]:
    txt = _block_children_text(node, indent=indent)
    return [ln for ln in txt.splitlines() if ln.strip()]

def _postprocess_lines(lines: List[str]) -> List[str]:
    # collapse too many blank lines
    out: List[str] = []
    blank = 0
    for ln in lines:
        if not ln.strip():
            blank += 1
            if blank <= 1:
                out.append("")
        else:
            blank = 0
            out.append(ln)
    return out
