<template>
  <div class="rich-editor-wrapper" ref="editorWrapper" :data-auto-height="autoHeight || undefined">
    <TextEditorToolbar v-if="editor" :editor="editor" @setLink="setLink" @insertImage="insertImage"
      @insertDiceFontCharacter="insertDiceFontCharacter" />

    <editor-content class="rich-text-content" :editor="editor" @click.stop />
    <div v-if="!editor" class="editor-loading">Loading editor...</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { getDiceFontClass, parseDiceFontClass } from '@/utils/diceFontUtils'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableHeader from '@tiptap/extension-table-header'
import TableCell from '@tiptap/extension-table-cell'
import DiceFontNode from '@/extensions/DiceFontNode'
import TextEditorToolbar from './TextEditorToolbar.vue'

const MIN_EDITOR_HEIGHT = 200
const MAX_EDITOR_HEIGHT = 420
const AUTO_HEIGHT_BUFFER = 50

const props = defineProps({
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
    default: '200px', // Matching MIN_EDITOR_HEIGHT - can't reference local constants here
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  autoHeight: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])

const editor = ref()
const editorWrapper = ref()
const dynamicHeight = ref(props.height)
const maxHeight = computed(() => props.autoHeight ? 'none' : `${MAX_EDITOR_HEIGHT}px`)

const updateHeight = () => {
  if (!props.autoHeight || !editorWrapper.value) return
  nextTick(() => {
    const pm = editorWrapper.value?.querySelector('.ProseMirror')
    if (pm) {
      pm.style.height = 'auto'
      const scrollHeight = pm.scrollHeight
      const newHeight = Math.max(MIN_EDITOR_HEIGHT, scrollHeight + AUTO_HEIGHT_BUFFER)
      dynamicHeight.value = newHeight + 'px'
      pm.style.height = 'auto'
    }
  })
}

const setLink = () => {
  const previousUrl = editor.value.getAttributes('link').href
  const url = window.prompt('URL', previousUrl)

  if (url === null) {
    return
  }

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run()
    return
  }

  const validUrl = url.match(/^https?:\/\//) ? url : `https://${url}`
  editor.value
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: validUrl })
    .run()
}

const insertImage = () => {
  const url = window.prompt('Image URL')

  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run()
  }
}

const insertDiceFontCharacter = () => {
  const identifier = window.prompt(
    'Enter DiceFont identifier (e.g., df-d8-3 for a d8 showing 3):',
  )
  if (identifier) {
    const parsed = parseDiceFontClass(identifier)
    if (parsed) {
      const diceClass = getDiceFontClass(parsed.dieSize, parsed.value)
      editor.value.chain().focus().insertDiceFont(diceClass).run()
    } else {
      alert(
        'Invalid DiceFont identifier. Please use the format df-d{sides}-{value}.',
      )
    }
  }
}

const focus = () => {
  editor.value?.chain().focus().run()
}

watch(() => props.modelValue, (newValue) => {
  // Only update the editor if the content is different to avoid cursor jumps
  const currentContent = editor.value?.getHTML()
  if (editor.value && newValue !== currentContent) {
    editor.value.commands.setContent(newValue)
  }
  if (props.autoHeight) {
    nextTick(updateHeight)
  }
})

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    editable: !props.readonly,
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
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'editor-table',
        },
      }),
      TableRow,
      TableHeader,
      TableCell,
      DiceFontNode,
    ],
    onUpdate: () => {
      const htmlContent = editor.value.getHTML()
      // Check if content is effectively empty (just empty p tags or whitespace)
      const isEmpty = htmlContent === '<p></p>' ||
        htmlContent.replace(/<p><\/p>/g, '').trim() === '' ||
        editor.value.getText().trim() === ''

      emit('update:modelValue', isEmpty ? '' : htmlContent)
      if (props.autoHeight) {
        nextTick(updateHeight)
      }
    },
  })

  if (props.autoHeight) {
    nextTick(updateHeight)
  }
})

onBeforeUnmount(() => {
  if (editor.value) {
    editor.value.destroy()
  }
})

// Expose methods for parent components
defineExpose({
  focus,
  updateHeight
})
</script>

<style scoped>
@import '@/styles/design-tokens.css';
@import '@/styles/rich-text-content.css';

.dicefont {
  font-family: var(--font-family-dice) !important;
}

.rich-editor-wrapper {
  border: 1px solid var(--color-gray-medium);
  border-radius: var(--radius-5);
  overflow: hidden;
  background-color: var(--color-bg-secondary);
  text-align: left;
  display: flex;
  flex-direction: column;
  min-height: 100px;
  width: 100%;
}

.rich-editor-wrapper:not([data-auto-height]) {
  height: v-bind(dynamicHeight);
  max-height: v-bind(maxHeight);
}

.rich-editor-wrapper[data-auto-height] {
  height: auto;
  max-height: none;
}

.rich-editor-wrapper[data-auto-height] :deep(.ProseMirror) {
  height: auto;
  overflow: visible;
}

.editor-loading {
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-gray-light);
}

:deep(.ProseMirror) {
  padding: var(--space-md);
  padding-bottom: var(--space-xl);
  min-height: 100px;
  flex: 1;
  outline: none;
  box-sizing: border-box;
  font-size: var(--font-size-16);
  line-height: var(--line-height-loose);
}

:deep(.ProseMirror)>* {
  max-width: 100%;
}

.editor-image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

/* Table styles in editor */
:deep(.ProseMirror table) {
  border-collapse: collapse;
  width: 100%;
  margin: var(--space-sm) 0;
  font-size: var(--font-size-12);
  line-height: 1.2;
}

:deep(.ProseMirror th),
:deep(.ProseMirror td) {
  border: 1px solid var(--color-gray-medium);
  padding: var(--space-xs) var(--space-sm);
  text-align: left;
  vertical-align: middle;
  min-width: 50px;
}

:deep(.ProseMirror th) {
  background-color: var(--color-gray-dark);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}

:deep(.ProseMirror tr:nth-child(even) td) {
  background-color: var(--overlay-black-medium);
}

:deep(.ProseMirror tr:nth-child(odd) td) {
  background-color: var(--color-gray-dark);
}

:deep(.ProseMirror td p),
:deep(.ProseMirror th p) {
  margin: 0;
  padding: 0;
}
</style>
