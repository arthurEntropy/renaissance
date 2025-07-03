<template>
  <div class="base-card" :style="cardStyle" @mouseenter="startSourceTooltipTimer" @mouseleave="clearSourceTooltipTimer"
    @click="collapsible ? toggleCollapsed() : null">
    <!-- Header Row -->
    <div class="card-header">
      <span v-if="collapsible" class="caret">{{ caretSymbol }}</span>
      <div class="name-container">
        <span class="item-name"><strong>{{ item.name }}</strong></span>
        <button v-if="editable" class="edit-button" @click.stop="$emit('edit', item)" :title="`Edit ${itemType}`">
          ✎
        </button>
      </div>
      <div class="item-info" v-if="metaInfo">
        <em>{{ metaInfo }}</em>
      </div>
    </div>

    <!-- Expandable Content -->
    <transition name="expand">
      <div v-if="!collapsible || !isCollapsed" class="card-content">
        <!-- Move large image inside the collapsible area -->
        <slot name="large-image"></slot>
        <slot name="content"></slot>
        <slot name="buttons"></slot>
      </div>
    </transition>

    <!-- Tooltip -->
    <!-- <div v-if="showTooltip" class="tooltip">
      from: {{ sourceName }}
    </div> -->

    <!-- XP or other badge -->
    <slot name="badge"></slot>

    <!-- Footer Slot -->
    <slot name="footer"></slot>
  </div>
</template>

<script>
export default {
  name: 'BaseCard',
  props: {
    item: {
      type: Object,
      required: true,
    },
    itemType: {
      type: String,
      default: 'item',
    },
    metaInfo: {
      type: String,
      default: '',
    },
    storeInstance: {
      type: Object,
      required: false,
      default: null,
    },
    initialCollapsed: {
      type: Boolean,
      default: false,
    },
    editable: {
      type: Boolean,
      default: false,
    },
    sources: {
      type: Object,
      default: () => ({
        ancestries: [],
        cultures: [],
        mestieri: [],
        worldElements: []
      })
    },
    collapsible: {
      type: Boolean,
      default: true,
    },
  },
  emits: ['edit', 'update', 'send-to-chat', 'height-changed'],
  data() {
    return {
      isCollapsed: this.initialCollapsed,
      sourceName: '',
      showTooltip: false,
      tooltipTimer: null,
      sourceLoaded: false,
    }
  },
  computed: {
    caretSymbol() {
      return this.isCollapsed ? '▶' : '▼'
    },
    cardStyle() {
      // First check for item's own background
      if (this.item.backgroundImage) {
        return {
          backgroundImage: `url(${this.item.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      }

      // Then check source's background
      const source = this.getSourceById(this.item.source)
      if (source && source.backgroundImage) {
        return {
          backgroundImage: `url(${source.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }
      }

      // Fallback
      return {
        background: 'rgba(0, 0, 0, 0.65)',
      }
    },
  },
  methods: {
    toggleCollapsed() {
      this.isCollapsed = !this.isCollapsed
    },
    startSourceTooltipTimer() {
      this.tooltipTimer = setTimeout(() => {
        this.showTooltip = true
      }, 1500)
    },
    clearSourceTooltipTimer() {
      clearTimeout(this.tooltipTimer)
      this.showTooltip = false
    },
    setSpanSize() {
      const rowHeight = 10
      const height = this.$el.getBoundingClientRect().height
      const rowSpan = Math.ceil(height / rowHeight)
      this.$el.style.setProperty('--card-span', rowSpan)
    },
    getSourceById(sourceId) {
      if (!sourceId) return null

      return (
        this.sources.ancestries.find((item) => item.id === sourceId) ||
        this.sources.cultures.find((item) => item.id === sourceId) ||
        this.sources.mestieri.find((item) => item.id === sourceId) ||
        this.sources.worldElements.find((item) => item.id === sourceId)
      )
    },
    updateSourceName() {
      if (!this.item.source) {
        this.sourceName = 'Unknown'
        return
      }

      const source = this.getSourceById(this.item.source)
      this.sourceName = source?.name || 'Unknown'
    },
  },
  watch: {
    'item.source': {
      immediate: true,
      handler() {
        this.updateSourceName()
      },
    },
    sources: {
      immediate: true,
      handler() {
        this.updateSourceName()
      }
    },
    isCollapsed(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.$nextTick(() => {
          setTimeout(() => {
            this.$emit('height-changed')
          }, 300)
        })
      }
    },
  },
  mounted() {
    this.$nextTick(this.setSpanSize)
  },
}
</script>

<style scoped>
.base-card {
  border: 1px solid #555;
  border-radius: 8px;
  padding: 10px;
  margin-top: 5px;
  cursor: pointer;
  transition:
    background-color 0.3s ease,
    transform 0.2s ease;
  width: 100%;
  position: relative;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
}

.base-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1;
  pointer-events: none;
}

.base-card>* {
  position: relative;
  z-index: 2;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.caret {
  margin-right: 10px;
  font-size: 16px;
  height: 20px;
  width: 20px;
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
}

.name-container {
  flex: 1;
  margin-right: 10px;
  display: flex;
  align-items: center;
  position: relative;
}

.item-name {
  font-size: 16px;
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
  word-wrap: break-word;
}

.item-info {
  font-size: 13px;
  color: #fff;
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
  font-weight: 500;
  letter-spacing: 0.01em;
  margin-left: 8px;
  margin-right: 0;
}

.edit-button {
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
  margin-left: 5px;
  background: none;
  border: none;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: text-shadow 0.2s ease-in-out;
  opacity: 0;
}

.base-card:hover .edit-button {
  opacity: 1;
}

.edit-button:hover {
  text-shadow: 0px 0px 5px white;
}
</style>
