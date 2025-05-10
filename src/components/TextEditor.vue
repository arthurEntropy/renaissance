<template>
    <div class="rich-editor-wrapper">
      <div class="rich-editor-toolbar" v-if="editor">
        <button 
          @click.stop.prevent="editor.chain().focus().toggleBold().run()" 
          :class="{ 'is-active': editor?.isActive('bold') }"
          title="Bold"
        >
          B
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().toggleItalic().run()" 
          :class="{ 'is-active': editor?.isActive('italic') }"
          title="Italic"
        >
          I
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().setParagraph().run()" 
          :class="{ 'is-active': editor?.isActive('paragraph') }"
          title="Paragraph"
        >
          ¶
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().toggleHeading({ level: 1 }).run()" 
          :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }"
          title="Heading 1"
        >
          H1
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().toggleHeading({ level: 2 }).run()" 
          :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }"
          title="Heading 2"
        >
          H2
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().toggleHeading({ level: 3 }).run()" 
          :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }"
          title="Heading 3"
        >
          H3
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().toggleHeading({ level: 4 }).run()" 
          :class="{ 'is-active': editor?.isActive('heading', { level: 4 }) }"
          title="Heading 4"
        >
          H4
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().toggleBulletList().run()" 
          :class="{ 'is-active': editor?.isActive('bulletList') }"
          title="Bullet List"
        >
          •
        </button>
        <button 
          @click.stop.prevent="setLink" 
          :class="{ 'is-active': editor?.isActive('link') }"
          title="Add Link"
        >
          🔗
        </button>
        <button 
          @click.stop.prevent="editor.chain().focus().unsetLink().run()" 
          :disabled="!editor?.isActive('link')"
          title="Remove Link"
        >
          🔗❌
        </button>
      </div>
      <editor-content :editor="editor" @click.stop />
      <div v-if="!editor" class="editor-loading">Loading editor...</div>
    </div>
  </template>
  
  <script>
  import { Editor, EditorContent } from '@tiptap/vue-3'
  import StarterKit from '@tiptap/starter-kit'
  import Link from '@tiptap/extension-link'
  
  export default {
    name: 'RichTextEditor',
    components: {
      EditorContent,
    },
    props: {
      modelValue: {
        type: String,
        default: '',
      },
      placeholder: {
        type: String,
        default: 'Write something...'
      },
      height: {
        type: String,
        default: '200px'
      },
      readonly: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue'],
    data() {
      return {
        editor: null,
      }
    },
    watch: {
      modelValue(newValue) {
        // Only update the editor if the content is different to avoid cursor jumps
        const currentContent = this.editor?.getHTML();
        if (this.editor && newValue !== currentContent) {
          this.editor.commands.setContent(newValue);
        }
      }
    },
    mounted() {
      this.editor = new Editor({
        content: this.modelValue,
        editable: !this.readonly,
        extensions: [
          StarterKit,
          Link.configure({
            openOnClick: false,
            linkOnPaste: true,
            HTMLAttributes: {
              rel: 'noopener noreferrer',
              target: '_blank'
            }
          }),
          // Other extensions...
        ],
        onUpdate: () => {
          this.$emit('update:modelValue', this.editor.getHTML())
        },
      });
    },
    beforeUnmount() {
      if (this.editor) {
        this.editor.destroy();
      }
    },
    methods: {
      setLink() {
        const previousUrl = this.editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
  
        if (url === null) {
          return;
        }
  
        if (url === '') {
          this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }
  
        const validUrl = url.match(/^https?:\/\//) ? url : `https://${url}`;
        this.editor.chain().focus().extendMarkRange('link').setLink({ href: validUrl }).run();
      },
      focus() {
        this.editor?.chain().focus().run();
      }
    }
  };
  </script>
  
  <style scoped>
  .rich-editor-wrapper {
    border: 1px solid #444;
    border-radius: 4px;
    overflow: hidden;
    background-color: #111;
    text-align: left;
  }
  
  .rich-editor-toolbar {
    padding: 8px;
    display: flex;
    border-bottom: 1px solid #444;
    gap: 8px;
    background: #222;
  }
  
  .rich-editor-toolbar button {
    background: #333;
    border: none;
    color: #eee;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    min-width: 30px;
    font-weight: bold;
  }
  
  .rich-editor-toolbar button.is-active {
    background: #555;
    color: white;
  }
  
  .rich-editor-toolbar button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  .editor-loading {
    padding: 20px;
    text-align: center;
    color: #777;
  }
  
  :deep(.ProseMirror) {
    padding: 10px;
    min-height: v-bind(height);
    outline: none;
    line-height: 1.5;
  }
  
  :deep(.ProseMirror p) {
    margin: 0.5em 0;
  }
  
  :deep(.ProseMirror a) {
    color: #58a6ff;
    text-decoration: underline;
  }
  
  :deep(.ProseMirror h3) {
    margin: 1em 0 0.5em;
    font-size: 1.3em;
  }
  
  :deep(.ProseMirror ul) {
    padding-left: 20px;
    margin: 0.5em 0;
  }
  
  :deep(.ProseMirror ul li) {
    margin-bottom: 0.3em;
  }
  </style>