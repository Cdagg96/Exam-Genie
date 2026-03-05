"use client";

import React, { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Extension } from "@tiptap/core";



type Props = {
  initialContent: any;
  resetKey?: string; //used by edit exam
  onSave?: (content: any) => Promise<void>;
  onChange?: (content: any) => void;
  isSaving?: boolean;
  showSaveButton?: boolean; // dont show save instuctions button on edit exam
  forceLight?: boolean; //has to be light mode always on edit exam
};

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px"];

const EMPTY_DOC = { type: "doc", content: [{ type: "paragraph" }] };

export default function InstructionEditor({ initialContent, resetKey, onSave, onChange, isSaving = false, showSaveButton = true, forceLight = false }: Props) {
  const [isBold, setIsBold] = useState(false);
  const [isBullets, setIsBullets] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        bulletList: {},
      }),
      TextStyle,
      FontSize,
    ],
    content: EMPTY_DOC,
    editorProps: {
      attributes: {
        class:
          "min-h-[180px] w-full rounded-xl border p-4 text-sm focus:outline-none " +
          "[&_ul]:list-disc [&_ul]:pl-6 [&_li]:my-1 " +
          (forceLight
            ? "border-slate-200 bg-white text-slate-900"
            : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0b1220] text-slate-900 dark:text-slate-100"),
      },
    },
  });

  const loadedKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!editor) return;

    // Only set content the first time for a given resetKey
    const key = resetKey ?? "__default__";
    if (loadedKeyRef.current === key) return;

    editor.commands.setContent(initialContent || { type: "doc", content: [{ type: "paragraph" }] });
    loadedKeyRef.current = key;
  }, [editor, resetKey]);


  // Push edits upward (Edit Exam uses this)
  useEffect(() => {
    if (!editor || !onChange) return;

    const push = () => onChange(editor.getJSON());

    editor.on("transaction", push);
    return () => {
      editor.off("transaction", push);
    };
  }, [editor, onChange]);

  // Keep toolbar state in sync
  useEffect(() => {
    if (!editor) return;

    const sync = () => {
      setIsBold(editor.isActive("bold"));
      setIsBullets(editor.isActive("bulletList"));
    };

    sync();
    editor.on("selectionUpdate", sync);
    editor.on("transaction", sync);

    return () => {
      editor.off("selectionUpdate", sync);
      editor.off("transaction", sync);
    };
  }, [editor]);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    "px-3 py-1 rounded-lg border transition " +
    (forceLight
      ? active
        ? "bg-sky-200 text-slate-900 border-slate-200"
        : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
      : active
        ? "bg-sky-300 dark:bg-sky-900 text-slate-900 dark:text-white"
        : "bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800");

  const setFontSize = (size: string) => {
    editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
  };

  const handleSave = async () => {
    if (!onSave) return;
    await onSave(editor.getJSON());
  };

  return (
    <div className="space-y-3">
      <div className={forceLight ? "text-sm font-medium text-slate-700" : "text-sm font-medium text-secondary"}>
        Exam Instructions
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <button
          type="button"
          className={btnClass(isBold)}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          Bold
        </button>

        <button
          type="button"
          className={btnClass(isBullets)}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          Bullet Point
        </button>

        <select
          className={"px-3 py-1 rounded-lg border " +(forceLight ? "bg-white text-slate-900 border-slate-200": "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800")}
          onChange={(e) => setFontSize(e.target.value)}
          defaultValue=""
        >
          <option value="" disabled>
            Font size
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {showSaveButton && (
          <div className="ml-auto">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 btn btn-primary-blue disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Instructions"}
            </button>
          </div>
        )}
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}

// for the font sizes
const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize || null,
            renderHTML: attributes => {
              if (!attributes.fontSize) return {};
              return { style: `font-size: ${attributes.fontSize}` };
            },
          },
        },
      },
    ];
  },
});