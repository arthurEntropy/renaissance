<template>
    <div v-if="showBadge" :class="badgeClass" :title="title">
        {{ displayText }}
    </div>
</template>

<script>
import { computed } from 'vue'

export default {
    name: 'BadgeDisplay',
    props: {
        type: {
            type: String,
            required: true,
            validator: (value) => ['xp', 'sol', 'custom'].includes(value)
        },
        value: {
            type: [String, Number],
            required: true
        },
        condition: {
            type: Boolean,
            default: true
        },
        position: {
            type: String,
            default: 'bottom-left',
            validator: (value) => ['bottom-left', 'bottom-right', 'top-left', 'top-right'].includes(value)
        },
        customClass: {
            type: String,
            default: ''
        },
        title: {
            type: String,
            default: ''
        }
    },

    setup(props) {
        const showBadge = computed(() => {
            return props.condition && props.value
        })

        const displayText = computed(() => {
            switch (props.type) {
                case 'xp':
                    return `${props.value} XP`
                case 'sol':
                    return `${props.value} 🪙`
                default:
                    return props.value
            }
        })

        const badgeClass = computed(() => {
            const baseClass = 'badge-display'
            const typeClass = `badge-${props.type}`
            const positionClass = `badge-${props.position}`

            return [
                baseClass,
                typeClass,
                positionClass,
                props.customClass
            ].filter(Boolean).join(' ')
        })

        return {
            showBadge,
            displayText,
            badgeClass
        }
    }
}
</script>

<style scoped>
.badge-display {
    position: absolute;
    font-size: 12px;
    font-weight: bold;
    padding: 2px 8px;
    border-radius: 10px;
    box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
    pointer-events: none;
    z-index: 10;
}

/* Badge types */
.badge-xp {
    background-color: goldenrod;
    color: black;
}

.badge-sol {
    background-color: darkgoldenrod;
    color: white;
    padding: 2px 8px 4px 8px;
}

.badge-custom {
    background-color: #666;
    color: white;
}

/* Positioning */
.badge-bottom-left {
    bottom: 0px;
    left: 0px;
    border-top-right-radius: 10px;
    border-bottom-left-radius: 5px;
}

.badge-bottom-right {
    bottom: 0px;
    right: 0px;
    border-top-left-radius: 10px;
    border-bottom-right-radius: 5px;
}

.badge-top-left {
    top: 0px;
    left: 0px;
    border-bottom-right-radius: 10px;
    border-top-left-radius: 5px;
}

.badge-top-right {
    top: 0px;
    right: 0px;
    border-bottom-left-radius: 10px;
    border-top-right-radius: 5px;
}

/* Special styling for improvement badges */
.badge-bottom-left.improvement-badge {
    bottom: -5px;
    border-bottom-left-radius: 5px;
}
</style>
