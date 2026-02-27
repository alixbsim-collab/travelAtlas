import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Image as ImageIcon, Link as LinkIcon, Undo, Redo, Minus, Quote, Upload } from 'lucide-react';
import ImageUploader from '../ui/ImageUploader';

function ImagePopover({ editor, onClose }) {
  const [tab, setTab] = useState('upload');
  const [urlValue, setUrlValue] = useState('');
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const insertImage = (url) => {
    editor.chain().focus().setImage({ src: url }).run();
    onClose();
  };

  return (
    <div ref={popoverRef} className="absolute top-full left-0 mt-1 z-50 bg-white rounded-xl shadow-lg border border-platinum-200 p-4 w-80">
      <div className="flex gap-2 mb-3">
        <button
          type="button"
          onClick={() => setTab('upload')}
          className={`flex-1 text-sm py-1.5 px-3 rounded-lg font-medium transition-colors ${
            tab === 'upload' ? 'bg-coral-100 text-coral-700' : 'text-platinum-600 hover:bg-platinum-100'
          }`}
        >
          <Upload size={14} className="inline mr-1" /> Upload
        </button>
        <button
          type="button"
          onClick={() => setTab('url')}
          className={`flex-1 text-sm py-1.5 px-3 rounded-lg font-medium transition-colors ${
            tab === 'url' ? 'bg-coral-100 text-coral-700' : 'text-platinum-600 hover:bg-platinum-100'
          }`}
        >
          <LinkIcon size={14} className="inline mr-1" /> URL
        </button>
      </div>

      {tab === 'upload' ? (
        <ImageUploader onUpload={insertImage} />
      ) : (
        <div className="space-y-2">
          <input
            type="url"
            value={urlValue}
            onChange={(e) => setUrlValue(e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="w-full px-3 py-2 text-sm border border-platinum-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-400"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && urlValue.trim()) {
                insertImage(urlValue.trim());
              }
            }}
          />
          <button
            type="button"
            onClick={() => urlValue.trim() && insertImage(urlValue.trim())}
            className="w-full text-sm py-2 bg-coral-400 text-white rounded-lg hover:bg-coral-500 transition-colors font-medium"
          >
            Insert Image
          </button>
        </div>
      )}
    </div>
  );
}

function MenuBar({ editor }) {
  const [showImagePopover, setShowImagePopover] = useState(false);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt('Enter URL:');
    if (url) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  };

  const ToolbarButton = ({ icon: Icon, action, active, title }) => (
    <button
      type="button"
      onClick={action}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-coral-100 text-coral-700'
          : 'hover:bg-platinum-200 text-platinum-700'
      }`}
      title={title}
    >
      <Icon size={16} />
    </button>
  );

  const Divider = () => <div className="w-px h-6 bg-platinum-300 mx-1" />;

  return (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-platinum-200 bg-platinum-50 rounded-t-lg">
      {/* Text Style */}
      <ToolbarButton icon={Bold} action={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold" />
      <ToolbarButton icon={Italic} action={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic" />
      <ToolbarButton icon={Heading2} action={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2" />
      <ToolbarButton icon={Heading3} action={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3" />

      <Divider />

      {/* Structure */}
      <ToolbarButton icon={List} action={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet List" />
      <ToolbarButton icon={ListOrdered} action={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Ordered List" />
      <ToolbarButton icon={Quote} action={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Blockquote" />
      <ToolbarButton icon={Minus} action={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="Horizontal Rule" />

      <Divider />

      {/* Media */}
      <div className="relative">
        <ToolbarButton icon={ImageIcon} action={() => setShowImagePopover(!showImagePopover)} active={showImagePopover} title="Add Image" />
        {showImagePopover && (
          <ImagePopover editor={editor} onClose={() => setShowImagePopover(false)} />
        )}
      </div>
      <ToolbarButton icon={LinkIcon} action={addLink} active={editor.isActive('link')} title="Add Link" />

      <Divider />

      {/* History */}
      <ToolbarButton icon={Undo} action={() => editor.chain().focus().undo().run()} active={false} title="Undo" />
      <ToolbarButton icon={Redo} action={() => editor.chain().focus().redo().run()} active={false} title="Redo" />
    </div>
  );
}

function RichTextEditor({ content, onChange, placeholder = 'Start writing...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-platinum-200 rounded-lg overflow-hidden">
      <MenuBar editor={editor} />
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[150px] focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[150px] [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-platinum-400 [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left [&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0 [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none [&_.ProseMirror_img]:max-w-full [&_.ProseMirror_img]:rounded-lg [&_.ProseMirror_img]:my-4"
      />
    </div>
  );
}

export default RichTextEditor;
