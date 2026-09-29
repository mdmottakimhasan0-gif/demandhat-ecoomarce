import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import { Image } from "@tiptap/extension-image";
import { HorizontalRule } from "@tiptap/extension-horizontal-rule";
import { Placeholder } from "@tiptap/extension-placeholder";
import FontSize from "tiptap-extension-font-size"; // Add this
import axios from "axios";
import { toast } from "react-hot-toast";

import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    AlignLeft,
    AlignCenter,
    AlignRight,
    List,
    ListOrdered,
    Minus,
    Image as ImageIcon,
    Palette,
    Type,
} from "lucide-react";

const TiptapEditor = ({ value, onChange, placeholder }) => {
    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                // Ensure these are enabled
                bulletList: true,
                orderedList: true,
                heading: { levels: [1, 2, 3, 4, 5, 6] },
            }),
            Underline,
            TextStyle,
            Color,
            FontSize, // Font size extension
            TextAlign.configure({ types: ["heading", "paragraph"] }),
            Image.configure({ inline: true, allowBase64: true }),
            HorizontalRule,
            Placeholder.configure({ placeholder }),
        ],
        content: value,
        editorProps: {
            attributes: {
                class: "outline-none focus:outline-none min-h-[250px] text-slate-800 dark:text-slate-100 font-hindSiliguri",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    if (!editor) return null;

    const addLocalImage = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("image", file);
            try {
                const response = await axios.post(
                    "/admin/upload-editor-image",
                    formData,
                );
                editor
                    .chain()
                    .focus()
                    .setImage({ src: response.data.url })
                    .run();
            } catch (error) {
                toast.error("Image upload failed");
            }
        }
    };

    const ToolbarButton = ({ onClick, isActive, children, title }) => (
        <button
            type="button"
            onClick={onClick}
            className={`p-2 rounded transition-colors ${isActive ? "bg-blue-600 text-white" : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
            title={title}
        >
            {children}
        </button>
    );

    return (
        <div className="border  border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-slate-900">
            {/* TOOLBAR */}
            <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-slate-800">
                {/* Font Size Dropdown */}
                <select
                    onChange={(e) =>
                        editor.chain().focus().setFontSize(e.target.value).run()
                    }
                    className="p-1 text-xs border rounded bg-white dark:bg-slate-700 dark:text-white"
                >
                    <option value="16px">Size</option>
                    {[
                        "12px",
                        "14px",
                        "16px",
                        "18px",
                        "20px",
                        "24px",
                        "30px",
                        "36px",
                    ].map((size) => (
                        <option key={size} value={size}>
                            {size}
                        </option>
                    ))}
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Headings */}
                <select
                    value={
                        editor.isActive("heading", { level: 1 })
                            ? "1"
                            : editor.isActive("heading", { level: 2 })
                              ? "2"
                              : editor.isActive("heading", { level: 3 })
                                ? "3"
                                : ""
                    }
                    onChange={(e) => {
                        const level = parseInt(e.target.value);
                        level
                            ? editor
                                  .chain()
                                  .focus()
                                  .toggleHeading({ level })
                                  .run()
                            : editor.chain().focus().setParagraph().run();
                    }}
                    className="p-1 text-xs border rounded bg-white dark:bg-slate-700 dark:text-white"
                >
                    <option value="">Paragraph</option>
                    <option value="1">Heading 1</option>
                    <option value="2">Heading 2</option>
                    <option value="3">Heading 3</option>
                </select>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    isActive={editor.isActive("bold")}
                >
                    <Bold size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    isActive={editor.isActive("italic")}
                >
                    <Italic size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().toggleUnderline().run()
                    }
                    isActive={editor.isActive("underline")}
                >
                    <UnderlineIcon size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Lists - Fixed logic */}
                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                    isActive={editor.isActive("bulletList")}
                >
                    <List size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                    isActive={editor.isActive("orderedList")}
                >
                    <ListOrdered size={18} />
                </ToolbarButton>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().setTextAlign("left").run()
                    }
                    isActive={editor.isActive({ textAlign: "left" })}
                >
                    <AlignLeft size={18} />
                </ToolbarButton>
                <ToolbarButton
                    onClick={() =>
                        editor.chain().focus().setTextAlign("center").run()
                    }
                    isActive={editor.isActive({ textAlign: "center" })}
                >
                    <AlignCenter size={18} />
                </ToolbarButton>

                <div className="relative flex items-center ml-1">
                    <Palette
                        size={18}
                        className="absolute left-1 pointer-events-none text-gray-400"
                    />
                    <input
                        type="color"
                        onInput={(e) =>
                            editor
                                .chain()
                                .focus()
                                .setColor(e.target.value)
                                .run()
                        }
                        className="w-8 h-8 opacity-0 cursor-pointer  dark:text-gray-300"
                    />
                </div>

                <label className="p-2 cursor-pointer text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
                    <ImageIcon size={18} />
                    <input
                        type="file"
                        className="hidden  dark:text-gray-300"
                        accept="image/*"
                        onChange={addLocalImage}
                    />
                </label>
            </div>

            {/* EDITOR CONTENT - Restored default spacing */}
            <div className="p-4 min-h-[250px]">
                <EditorContent
                    editor={editor}
                    className="outline-none tiptap-content font-hindSiliguri"
                />
            </div>

            {/* CRITICAL CSS: Standard React style injection */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .tiptap-content .tiptap {
                    outline: none !important;
                    min-height: 250px;
                }
                /* Bullet/ordered list defaults in case of base resets */
                .tiptap ul, .tiptap-content ul {
                    list-style-type: disc !important;
                    padding-left: 1.5rem !important;
                    margin: 1rem 0 !important;
                }
                .tiptap ol, .tiptap-content ol {
                    list-style-type: decimal !important;
                    padding-left: 1.5rem !important;
                    margin: 1rem 0 !important;
                }
                .tiptap li, .tiptap-content li {
                    margin-bottom: 0.5rem !important;
                }
                .tiptap p.is-editor-empty:first-child::before {
                    content: attr(data-placeholder);
                    float: left;
                    color: #adb5bd;
                    pointer-events: none;
                    height: 0;
                }
            `,
                }}
            />
        </div>
    );
};

export default TiptapEditor;
