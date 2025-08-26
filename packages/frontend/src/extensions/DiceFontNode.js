import { Node } from '@tiptap/core'

/**
 * Custom Tiptap node for rendering dice icons using DiceFont
 * Allows insertion of styled dice icons within rich text content
 */
const DiceFontNode = Node.create({
  name: 'diceFont',

  group: 'inline',

  inline: true,

  atom: true,

  addAttributes() {
    return {
      class: {
        default: null,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.dice-icon',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      {
        ...HTMLAttributes,
        class: `dice-icon ${HTMLAttributes.class || ''}`.trim(),
        style: 'font-size: 36px;',
      },
    ]
  },

  addCommands() {
    return {
      insertDiceFont:
        (diceClass) =>
        ({ chain }) => {
          return chain()
            .insertContent({ type: this.name, attrs: { class: diceClass } })
            .run()
        },
    }
  },
})

export default DiceFontNode
