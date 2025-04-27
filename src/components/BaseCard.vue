<template>
    <div
      class="base-card"
      :style="cardStyle"
      @mouseenter="startSourceTooltipTimer"
      @mouseleave="clearSourceTooltipTimer"
      @click="toggleCollapsed"
    >
      <!-- Header Row -->
      <div class="card-header">
        <span class="caret">{{ caretSymbol }}</span>
        <div class="name-container">
          <span class="item-name"><strong>{{ item.name }}</strong></span>
          <button
            class="edit-button"
            @click.stop="$emit('edit', item)"
            :title="`Edit ${itemType}`"
          >
            ✎
          </button>
        </div>
        <div class="item-info" v-if="metaInfo">
          <em>{{ metaInfo }}</em>
        </div>
      </div>
  
      <!-- Large Image (Equipment Only) -->
      <slot name="large-image"></slot>
  
      <!-- Expandable Content -->
      <transition name="expand">
        <div v-if="!isCollapsed" class="card-content">
          <slot name="content"></slot>
          <slot name="buttons"></slot>
        </div>
      </transition>
      
      <!-- Tooltip -->
      <div v-if="showTooltip" class="tooltip">
        from: {{ sourceName }}
      </div>
      
      <!-- XP or other badge -->
      <slot name="badge"></slot>
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
        default: 'item'
      },
      metaInfo: {
        type: String,
        default: ''
      },
      storeInstance: {
        type: Object,
        required: true
      },
      initialCollapsed: {
        type: Boolean,
        default: false
      }
    },
    emits: ['edit', 'update', 'send-to-chat'],
    data() {
      return {
        isCollapsed: this.initialCollapsed,
        sourceName: '',
        showTooltip: false,
        tooltipTimer: null,
      };
    },
    computed: {
      caretSymbol() {
        return this.isCollapsed ? '▶' : '▼';
      },
      cardStyle() {
        // First check for item's own background
        if (this.item.backgroundImage) {
          return {
            backgroundImage: `url(${this.item.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          };
        }
  
        // Then check source's background
        const source = this.storeInstance.getSourceById(this.item.source);
        if (source && source.backgroundImage) {
          return {
            backgroundImage: `url(${source.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          };
        }
  
        // Fallback
        return {
          background: 'rgba(0, 0, 0, 0.65)',
        };
      },
    },
    methods: {
      toggleCollapsed() {
        this.isCollapsed = !this.isCollapsed;
      },
      startSourceTooltipTimer() {
        this.tooltipTimer = setTimeout(() => {
          this.showTooltip = true;
        }, 1500);
      },
      clearSourceTooltipTimer() {
        clearTimeout(this.tooltipTimer);
        this.showTooltip = false;
      },
      setSpanSize() {
        const rowHeight = 10;
        const height = this.$el.getBoundingClientRect().height;
        const rowSpan = Math.ceil(height / rowHeight);
        this.$el.style.setProperty('--card-span', rowSpan);
      },
      async fetchSourceInfo() {
        if (!this.item.source) {
          this.sourceName = 'Unknown';
          return;
        }
  
        await this.storeInstance.fetchAllSources();
        const source = this.storeInstance.getSourceById(this.item.source);
        this.sourceName = source?.name || 'Unknown';
      },
    },
    watch: {
      'item.source': {
        immediate: true,
        handler() {
          this.fetchSourceInfo();
        },
      },
      isCollapsed(newVal, oldVal) {
        if (newVal !== oldVal) {
            // Allow the transition to complete before measuring height
            this.$nextTick(() => {
            // Wait for transition animation
            setTimeout(() => {
                // Emit an event that the parent grid can listen for
                this.$emit('height-changed');
            }, 300); // Match this to your CSS transition duration
            });
        }
      }
    },
    async created() {
      await this.fetchSourceInfo();
    },
    mounted() {
      this.$nextTick(this.setSpanSize);
    },
  };
  </script>
  
  <style scoped>
  .base-card {
    border: 1px solid #555;
    border-radius: 8px;
    padding: 10px;
    margin-top: 5px;
    cursor: pointer;
    color: white;
    transition: background-color 0.3s ease, transform 0.2s ease;
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

  .base-card > * {
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
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
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
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    word-wrap: break-word;
  }
  
  .edit-button {
    display: none;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    margin-left: 5px;
    background: none;
    border: none;
    color: white;
    font-size: 14px;
    cursor: pointer;
    transition: text-shadow 0.2s ease-in-out;
  }
  
  .base-card:hover .edit-button {
    display: inline-block;
  }
  
  .edit-button:hover {
    text-shadow: 0px 0px 5px white;
  }
  
  .item-info {
    font-size: 14px;
    color: white;
    text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000;
    font-style: italic;
  }
  
  .card-content {
    font-size: 14px;
    color: white;
    overflow: hidden;
    position: relative;
    width: 100%;      /* Ensure content stays within the card */
    box-sizing: border-box;
  }
  
  .tooltip {
    position: absolute;
    bottom: -11px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    font-size: 12px;
    white-space: nowrap;
    z-index: 10;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
    pointer-events: none;
  }
  
  .expand-enter-active,
  .expand-leave-active {
    transition: all 0.3s ease;
  }
  
  .expand-enter-from,
  .expand-leave-to {
    opacity: 0;
    max-height: 0;
  }
  
  .expand-enter-to,
  .expand-leave-from {
    opacity: 1;
    max-height: 500px;
  }
  </style>