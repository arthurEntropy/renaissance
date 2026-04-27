import { onBeforeUnmount, ref, watch } from 'vue'

export function useAnchoredPickerTrigger(options = {}) {
    const {
        isOpenRef = null,
        onOpen = null,
        onClose = null,
        closeOnScroll = true,
        scrollContainerSelector = '.modal-content',
        autoSyncOnOpen = true,
    } = options

    const triggerRef = ref(null)
    const anchorPosition = ref(null)
    const scrollHostRef = ref(null)
    const localIsOpen = ref(false)
    const pickerIsOpen = isOpenRef || localIsOpen

    const syncAnchorPosition = () => {
        const triggerRect = triggerRef.value?.getBoundingClientRect?.()
        if (!triggerRect) return

        anchorPosition.value = {
            x: Math.round(triggerRect.left),
            y: Math.round(triggerRect.bottom + 4),
        }
    }

    const removeScrollListener = () => {
        if (!scrollHostRef.value) return
        scrollHostRef.value.removeEventListener('scroll', closePicker, true)
        scrollHostRef.value = null
    }

    const closePicker = () => {
        if (onClose) {
            onClose()
        } else {
            pickerIsOpen.value = false
        }
        removeScrollListener()
    }

    const attachScrollListener = () => {
        if (!closeOnScroll) return
        removeScrollListener()
        const scrollHost = triggerRef.value?.closest(scrollContainerSelector) || window
        scrollHostRef.value = scrollHost
        scrollHost.addEventListener('scroll', closePicker, true)
    }

    const openPicker = () => {
        syncAnchorPosition()
        if (onOpen) {
            onOpen()
        } else {
            pickerIsOpen.value = true
        }
        attachScrollListener()
    }

    const toggleFromTrigger = () => {
        if (pickerIsOpen.value) {
            closePicker()
            return
        }
        openPicker()
    }

    watch(
        () => pickerIsOpen.value,
        (isOpen) => {
            if (!isOpen) {
                removeScrollListener()
                return
            }

            if (autoSyncOnOpen) {
                syncAnchorPosition()
            }
        }
    )

    onBeforeUnmount(() => {
        removeScrollListener()
    })

    return {
        triggerRef,
        anchorPosition,
        showPicker: pickerIsOpen,
        syncAnchorPosition,
        openPicker,
        closePicker,
        toggleFromTrigger,
        removeScrollListener,
        attachScrollListener,
    }
}
