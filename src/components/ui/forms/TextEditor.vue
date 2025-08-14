<template>
  <div class="rich-editor-wrapper">
    <div class="rich-editor-toolbar" v-if="editor">
      <button @click.stop.prevent="editor.chain().focus().toggleBold().run()"
        :class="{ 'is-active': editor?.isActive('bold') }" title="Bold">
        B
      </button>
      <button @click.stop.prevent="editor.chain().focus().toggleItalic().run()"
        :class="{ 'is-active': editor?.isActive('italic') }" title="Italic">
        I
      </button>
      <button @click.stop.prevent="editor.chain().focus().setParagraph().run()"
        :class="{ 'is-active': editor?.isActive('paragraph') }" title="Paragraph">
        ¶
      </button>
      <button @click.stop.prevent="
        editor.chain().focus().toggleHeading({ level: 1 }).run()
        " :class="{ 'is-active': editor?.isActive('heading', { level: 1 }) }" title="Heading 1">
        H1
      </button>
      <button @click.stop.prevent="
        editor.chain().focus().toggleHeading({ level: 2 }).run()
        " :class="{ 'is-active': editor?.isActive('heading', { level: 2 }) }" title="Heading 2">
        H2
      </button>
      <button @click.stop.prevent="
        editor.chain().focus().toggleHeading({ level: 3 }).run()
        " :class="{ 'is-active': editor?.isActive('heading', { level: 3 }) }" title="Heading 3">
        H3
      </button>
      <button @click.stop.prevent="
        editor.chain().focus().toggleHeading({ level: 4 }).run()
        " :class="{ 'is-active': editor?.isActive('heading', { level: 4 }) }" title="Heading 4">
        H4
      </button>
      <button @click.stop.prevent="editor.chain().focus().toggleBulletList().run()"
        :class="{ 'is-active': editor?.isActive('bulletList') }" title="Bullet List">
        •
      </button>
      <button @click.stop.prevent="setLink" :class="{ 'is-active': editor?.isActive('link') }" title="Add Link">
        🔗
      </button>
      <button @click.stop.prevent="editor.chain().focus().unsetLink().run()" :disabled="!editor?.isActive('link')"
        title="Remove Link">
        🔗❌
      </button>
      <button @click.stop.prevent="insertImage" title="Insert Image">🖼️</button>
      <button @click.stop.prevent="editor.chain().focus().setTextAlign('left').run()"
        :class="{ 'is-active': editor?.isActive({ textAlign: 'left' }) }" title="Align Left">
        ⬅️
      </button>
      <button @click.stop.prevent="
        editor.chain().focus().setTextAlign('center').run()
        " :class="{ 'is-active': editor?.isActive({ textAlign: 'center' }) }" title="Align Center">
        ⬜
      </button>
      <button @click.stop.prevent="editor.chain().focus().setTextAlign('right').run()"
        :class="{ 'is-active': editor?.isActive({ textAlign: 'right' }) }" title="Align Right">
        ➡️
      </button>
      <button @click.stop.prevent="
        editor.chain().focus().setTextAlign('justify').run()
        " :class="{ 'is-active': editor?.isActive({ textAlign: 'justify' }) }" title="Justify">
        📏
      </button>
      <button @click.stop.prevent="insertDiceFontCharacter" title="Insert DiceFont Character">
        🎲
      </button>
    </div>
    <editor-content :editor="editor" @click.stop />
    <div v-if="!editor" class="editor-loading">Loading editor...</div>
  </div>
</template>

<script>
import { Editor, EditorContent } from '@tiptap/vue-3'
import { getDiceFontClass, parseDiceFontClass } from '@utils/diceFontUtils'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import DiceFontNode from '@/extensions/DiceFontNode'

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
      default: 'Write something...',
    },
    height: {
      type: String,
      default: '200px',
    },
    readonly: {
      type: Boolean,
      default: false,
    },
    autoHeight: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['update:modelValue'],
  data() {
    return {
      editor: null,
      dynamicHeight: this.height,
    }
  },
  watch: {
    modelValue(newValue) {
      // Only update the editor if the content is different to avoid cursor jumps
      const currentContent = this.editor?.getHTML()
      if (this.editor && newValue !== currentContent) {
        this.editor.commands.setContent(newValue)
      }
      if (this.autoHeight) {
        this.$nextTick(this.updateHeight)
      }
    },
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
            target: '_blank',
          },
        }),
        Image.configure({
          inline: false,
          HTMLAttributes: {
            class: 'editor-image',
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
        }),
        DiceFontNode,
        // Other extensions...
      ],
      onUpdate: () => {
        this.$emit('update:modelValue', this.editor.getHTML())
        if (this.autoHeight) {
          this.$nextTick(this.updateHeight)
        }
      },
    })
    if (this.autoHeight) {
      this.$nextTick(this.updateHeight)
    }
  },
  beforeUnmount() {
    if (this.editor) {
      this.editor.destroy()
    }
  },
  methods: {
    setLink() {
      const previousUrl = this.editor.getAttributes('link').href
      const url = window.prompt('URL', previousUrl)

      if (url === null) {
        return
      }

      if (url === '') {
        this.editor.chain().focus().extendMarkRange('link').unsetLink().run()
        return
      }

      const validUrl = url.match(/^https?:\/\//) ? url : `https://${url}`
      this.editor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: validUrl })
        .run()
    },
    insertImage() {
      const url = window.prompt('Image URL')

      if (url) {
        this.editor.chain().focus().setImage({ src: url }).run()
      }
    },
    insertDiceFontCharacter() {
      const identifier = window.prompt(
        'Enter DiceFont identifier (e.g., df-d8-3 for a d8 showing 3):',
      )
      if (identifier) {
        const parsed = parseDiceFontClass(identifier)
        if (parsed) {
          const diceClass = getDiceFontClass(parsed.dieSize, parsed.value)
          this.editor.chain().focus().insertDiceFont(diceClass).run()
        } else {
          alert(
            'Invalid DiceFont identifier. Please use the format df-d{sides}-{value}.',
          )
        }
      }
    },
    focus() {
      this.editor?.chain().focus().run()
    },
    updateHeight() {
      if (!this.autoHeight) return
      this.$nextTick(() => {
        const pm = this.$el.querySelector('.ProseMirror')
        if (pm) {
          pm.style.height = 'auto'
          const scrollHeight = pm.scrollHeight
          const minHeight = 200
          const newHeight = Math.max(minHeight, scrollHeight)
          this.dynamicHeight = newHeight + 'px'
          pm.style.height = this.dynamicHeight
        }
      })
    },
  },
}
</script>

<style scoped>
.dicefont {
  font-family: var(--font-family-dice) !important;
}

.rich-editor-wrapper {
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-4);
  overflow: hidden;
  background-color: var(--color-bg-secondary);
  text-align: left;
  display: flex;
  flex-direction: column;
  /* Use dynamicHeight if autoHeight, else use height prop */
  height: v-bind(dynamicHeight);
  min-height: 100px;
  /* Always allow vertical scrolling if content overflows */
  overflow-y: auto;
  max-height: 420px;
  width: 100%;
}

.rich-editor-toolbar {
  padding: 4px;
  display: flex;
  flex-wrap: wrap;
  border-bottom: 1px solid var(--color-gray-medium);
  gap: 4px;
  background: var(--color-gray-dark);
  position: sticky;
  top: 0;
  z-index: var(--z-interactive);
}

.rich-editor-toolbar button {
  background: var(--color-gray-medium);
  border: none;
  color: var(--color-white);
  padding: 2px 4px;
  border-radius: var(--radius-3);
  cursor: pointer;
  min-width: 22px;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-13);
  line-height: var(--line-height-normal);
}

.rich-editor-toolbar button.is-active {
  background: var(--color-gray-light);
  color: var(--color-white);
}

.rich-editor-toolbar button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.editor-loading {
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-gray-light);
}

:deep(.ProseMirror) {
  padding: var(--space-md);
  padding-bottom: 35px;
  min-height: 100px;
  /* Always allow vertical scrolling if content overflows */
  overflow-y: auto;
  /* If autoHeight is false, use fixed height and max-height */
  height: v-bind(dynamicHeight);
  max-height: 400px;
  box-sizing: border-box;
  font-size: var(--font-size-18);
  line-height: var(--line-height-normal);
}

:deep(.ProseMirror)>* {
  max-width: 100%;
}

:deep(.ProseMirror a) {
  color: var(--color-primary);
  text-decoration: underline;
}

:deep(.ProseMirror h2) {
  font-size: var(--font-size-36);
  margin: 1.5em 0 0 0;
  color: var(--color-accent-gold);
  font-weight: var(--font-weight-normal);
}

:deep(.ProseMirror h3) {
  margin: 1.5em 0 0 0;
  font-size: var(--font-size-24);
  color: var(--color-accent-gold);
}

:deep(.ProseMirror p) {
  margin: 0.5em 0;
  line-height: var(--line-height-normal);
}

:deep(.ProseMirror ul) {
  padding-left: 20px;
  margin: 0.5em 0;
}

:deep(.ProseMirror ul li) {
  margin-bottom: 0.3em;
}

:deep(.ProseMirror img),
:deep(.editor-image) {
  width: 100%;
  height: auto;
  display: block;
  margin: 0.5em 0;
}

.editor-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}
</style>
