import React from "react";

type Node = any;

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
          style={node.attrs?.textAlign ? { textAlign: node.attrs.textAlign } : undefined}
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
          style={fontSize ? { fontSize } : undefined}
        >
          {node.text}
        </span>
      );

    default:
      return null;
  }
}