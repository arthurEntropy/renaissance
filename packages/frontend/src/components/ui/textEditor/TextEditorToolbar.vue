<template>
    <div class="rich-editor-toolbar" v-if="props.editor">
        <ToolbarGroup v-for="(group, groupIndex) in toolbarGroups" :key="groupIndex">
            <ToolbarButton v-for="button in group" :key="button.key" :label="button.label" :icon="button.icon"
                :title="button.title"
                :is-active="typeof button.isActive === 'function' ? button.isActive(props.editor) : button.isActive"
                :action="() => button.action(props.editor)" />
        </ToolbarGroup>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import ToolbarButton from './ToolbarButton.vue'
import ToolbarGroup from './ToolbarGroup.vue'

// HeroIcon imports
import {
    BoldIcon,
    ItalicIcon,
    LinkIcon,
    PhotoIcon,
    Bars3BottomLeftIcon,
    Bars3Icon,
    Bars3BottomRightIcon,
    Bars4Icon,
    ListBulletIcon,
    LinkSlashIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
    editor: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['setLink', 'insertImage', 'insertDiceFontCharacter'])

// Toolbar configuration grouped by functionality
const toolbarGroups = computed(() => [
    // Text Formatting Group
    [
        {
            key: 'bold',
            icon: BoldIcon,
            title: 'Bold (Ctrl+B)',
            isActive: (editor) => editor?.isActive('bold'),
            action: (editor) => editor.chain().focus().toggleBold().run(),
            shortcut: 'Ctrl+B'
        },
        {
            key: 'italic',
            icon: ItalicIcon,
            title: 'Italic (Ctrl+I)',
            isActive: (editor) => editor?.isActive('italic'),
            action: (editor) => editor.chain().focus().toggleItalic().run(),
            shortcut: 'Ctrl+I'
        }
    ],
    // Structure Group
    [
        {
            key: 'paragraph',
            label: '¶',
            title: 'Paragraph (Ctrl+Alt+0)',
            isActive: (editor) => editor?.isActive('paragraph'),
            action: (editor) => editor.chain().focus().setParagraph().run(),
            shortcut: 'Ctrl+Alt+0'
        },
        {
            key: 'heading1',
            label: 'H1',
            title: 'Heading 1 (Ctrl+Alt+1)',
            isActive: (editor) => editor?.isActive('heading', { level: 1 }),
            action: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            shortcut: 'Ctrl+Alt+1'
        },
        {
            key: 'heading2',
            label: 'H2',
            title: 'Heading 2 (Ctrl+Alt+2)',
            isActive: (editor) => editor?.isActive('heading', { level: 2 }),
            action: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            shortcut: 'Ctrl+Alt+2'
        },
        {
            key: 'heading3',
            label: 'H3',
            title: 'Heading 3 (Ctrl+Alt+3)',
            isActive: (editor) => editor?.isActive('heading', { level: 3 }),
            action: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            shortcut: 'Ctrl+Alt+3'
        },
        {
            key: 'heading4',
            label: 'H4',
            title: 'Heading 4 (Ctrl+Alt+4)',
            isActive: (editor) => editor?.isActive('heading', { level: 4 }),
            action: (editor) => editor.chain().focus().toggleHeading({ level: 4 }).run(),
            shortcut: 'Ctrl+Alt+4'
        },
        {
            key: 'bulletList',
            icon: ListBulletIcon,
            title: 'Bullet List (Ctrl+Shift+8)',
            isActive: (editor) => editor?.isActive('bulletList'),
            action: (editor) => editor.chain().focus().toggleBulletList().run(),
            shortcut: 'Ctrl+Shift+8'
        }
    ],
    // Alignment Group
    [
        {
            key: 'alignLeft',
            icon: Bars3BottomLeftIcon,
            title: 'Align Left (Ctrl+Shift+L)',
            isActive: (editor) => editor?.isActive({ textAlign: 'left' }),
            action: (editor) => editor.chain().focus().setTextAlign('left').run(),
            shortcut: 'Ctrl+Shift+L'
        },
        {
            key: 'alignCenter',
            icon: Bars3Icon,
            title: 'Align Center (Ctrl+Shift+E)',
            isActive: (editor) => editor?.isActive({ textAlign: 'center' }),
            action: (editor) => editor.chain().focus().setTextAlign('center').run(),
            shortcut: 'Ctrl+Shift+E'
        },
        {
            key: 'alignRight',
            icon: Bars3BottomRightIcon,
            title: 'Align Right (Ctrl+Shift+R)',
            isActive: (editor) => editor?.isActive({ textAlign: 'right' }),
            action: (editor) => editor.chain().focus().setTextAlign('right').run(),
            shortcut: 'Ctrl+Shift+R'
        },
        {
            key: 'alignJustify',
            icon: Bars4Icon,
            title: 'Justify (Ctrl+Shift+J)',
            isActive: (editor) => editor?.isActive({ textAlign: 'justify' }),
            action: (editor) => editor.chain().focus().setTextAlign('justify').run(),
            shortcut: 'Ctrl+Shift+J'
        }
    ],
    // Links Group
    [
        {
            key: 'link',
            icon: LinkIcon,
            title: 'Add/Edit Link (Ctrl+K)',
            isActive: (editor) => editor?.isActive('link'),
            action: () => emit('setLink'),
            shortcut: 'Ctrl+K'
        },
        {
            key: 'unlink',
            icon: LinkSlashIcon,
            title: 'Remove Link',
            isActive: () => false,
            disabled: (editor) => !editor?.isActive('link'),
            action: (editor) => editor.chain().focus().unsetLink().run()
        }
    ],
    // Media & Special Content Group
    [
        {
            key: 'image',
            icon: PhotoIcon,
            title: 'Insert Image',
            isActive: () => false,
            action: () => emit('insertImage')
        },
        {
            key: 'diceFont',
            label: '🎲',
            title: 'Insert DiceFont Character',
            isActive: () => false,
            action: () => emit('insertDiceFontCharacter')
        }
    ]
])
</script>

<style scoped>
@import '@/styles/design-tokens.css';

.rich-editor-toolbar {
    display: flex;
    flex-wrap: wrap;
    border-bottom: 1px solid var(--color-gray-medium);
    gap: var(--space-xs);
    background: var(--color-gray-dark);
    position: sticky;
    top: 0;
    z-index: var(--z-interactive);
    padding: var(--space-xs);
}
</style>
