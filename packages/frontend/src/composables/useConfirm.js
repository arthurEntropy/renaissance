import { reactive } from 'vue'

// Module-level singleton so any component can trigger the one shared modal instance.
const state = reactive({
    open: false,
    message: '',
    title: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    resolve: null,
})

/**
 * Promise-based replacement for window.confirm().
 *
 * Usage:
 *   const { confirm } = useConfirm()
 *   if (await confirm('Delete this item?')) { ... }
 *
 * Place <ConfirmModal /> once in App.vue to render the shared modal.
 */
export function useConfirm() {
    function confirm(message, { title = '', confirmLabel = 'Confirm', cancelLabel = 'Cancel' } = {}) {
        return new Promise((resolve) => {
            state.message = message
            state.title = title
            state.confirmLabel = confirmLabel
            state.cancelLabel = cancelLabel
            state.resolve = resolve
            state.open = true
        })
    }

    function _settle(value) {
        state.open = false
        state.resolve?.(value)
        state.resolve = null
    }

    return { state, confirm, _settle }
}
