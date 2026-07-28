import { ref } from 'vue'

// Module-level reactive state shared between TabletopChatlog (writer) and
// TabletopActiveAbilitiesBar (reader) so the abilities bar can shift left
// when the chatlog expands to full height and would otherwise overlap.
const _chatlogWidth = ref(280)
const _chatlogExpanded = ref(false)

export function useTabletopChatlogState() {
    return {
        chatlogWidth: _chatlogWidth,
        chatlogExpanded: _chatlogExpanded,
    }
}
