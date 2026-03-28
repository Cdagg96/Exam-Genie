import React from "react";

type Node = any;

type TextSegment = {
  text: string;
  bold?: boolean;
  bullet?: boolean;
};  

export function renderTipTap(node: Node): React.ReactNode {
  if (!node) return null;

  switch (node.type) {

    case "doc":
      return node.content?.map((c: Node, i: number) => (
        <React.Fragment key={i}>
          {renderTipTap(c)}
        </React.Fragment>
      ));

    case "paragraph":
      return (
        <p
          style={{
            ...(node.attrs?.textAlign ? { textAlign: node.attrs.textAlign } : {}),
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
          className="mb-2"
        >
          {node.content?.map((c: Node, i: number) => (
            <React.Fragment key={i}>{renderTipTap(c)}</React.Fragment>
          ))}
        </p>
      );

    case "bulletList":
      return (
        <ul className="list-disc pl-5">
          {node.content?.map((c: Node, i: number) => (
            <React.Fragment key={i}>{renderTipTap(c)}</React.Fragment>
          ))}
        </ul>
      );

    case "listItem":
      return (
        <li className="mb-1">
          {node.content?.map((c: Node, i: number) => (
            <React.Fragment key={i}>{renderTipTap(c)}</React.Fragment>
          ))}
        </li>
      );

    case "text":
      const bold = node.marks?.some((m: any) => m.type === "bold");
      const fontSize = node.marks?.find((m: any) => m.type === "textStyle")?.attrs?.fontSize;

      return (
        <span
          className={bold ? "font-bold" : undefined}
          style={{
            ...(fontSize ? { fontSize } : {}),
            overflowWrap: "anywhere",
            wordBreak: "break-word",
          }}
        >
          {node.text}
        </span>
      );

    default:
      return null;
  }
}

//Converts tiptap to a flat array of text segments
export function tiptapToSegments(node: Node): TextSegment[] {
  if (!node) return [];

  switch (node.type) {

    case "doc":
      return node.content?.flatMap(tiptapToSegments) ?? [];

    case "paragraph":
      return [
        ...(node.content?.flatMap(tiptapToSegments) ?? []),
        { text: "\n" }
      ];

    case "bulletList":
      return node.content?.flatMap(tiptapToSegments) ?? [];

    case "listItem":
      return [
        { text: "•", bullet: true },
        ...(node.content?.flatMap(tiptapToSegments) ?? []),
      ];

    case "text":
      const bold = node.marks?.some((m: any) => m.type === "bold");

      return [{ text: node.text ?? "", bold }];

    default:
      return [];
  }
}