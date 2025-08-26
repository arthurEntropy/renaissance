<template>
  <div class="rich-editor-wrapper">
    <TextEditorToolbar v-if="editor" :editor="editor" @setLink="setLink" @insertImage="insertImage"
      @insertDiceFontCharacter="insertDiceFontCharacter" />

    <editor-content :editor="editor" @click.stop />
    <div v-if="!editor" class="editor-loading">Loading editor...</div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount, nextTick, computed } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import { getDiceFontClass, parseDiceFontClass } from '@shared/utils/diceFontUtils'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import DiceFontNode from '@/extensions/DiceFontNode'
import TextEditorToolbar from './TextEditorToolbar.vue'

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
})

const emit = defineEmits(['update:modelValue'])

const editor = ref()
const dynamicHeight = ref(props.height)
const maxHeight = computed(() => props.autoHeight ? 'none' : '420px')
const proseMirrorMaxHeight = computed(() => props.autoHeight ? 'none' : '400px')

const updateHeight = () => {
  if (!props.autoHeight) return
  nextTick(() => {
    const pm = document.querySelector('.ProseMirror')
    if (pm) {
      pm.style.height = 'auto'
      const scrollHeight = pm.scrollHeight
      const minHeight = 200
      const newHeight = Math.max(minHeight, scrollHeight + 50)
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
      DiceFontNode,
    ],
    onUpdate: () => {
      emit('update:modelValue', editor.value.getHTML())
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
  height: v-bind(dynamicHeight);
  min-height: 100px;
  overflow-y: auto;
  max-height: v-bind(maxHeight);
  width: 100%;
}

.editor-loading {
  padding: var(--space-xl);
  text-align: center;
  color: var(--color-gray-light);
}

:deep(.ProseMirror) {
  padding: var(--space-md);
  padding-bottom: var(--space-2xl);
  min-height: 100px;
  overflow-y: auto;
  height: v-bind(dynamicHeight);
  max-height: v-bind(proseMirrorMaxHeight);
  box-sizing: border-box;
  font-size: var(--font-size-16);
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
  padding-left: var(--space-xl);
  margin: 0.5em 0;
}

:deep(.ProseMirror ul li) {
  margin-bottom: 0.3em;
}

:deep(.ProseMirror img),
:deep(.editor-image) {
  max-width: 100%;
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
