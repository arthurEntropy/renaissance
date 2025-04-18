<template>
    <div
      class="ability-card"
      :style="gradientStyle"
      @mouseenter="startSourceTooltipTimer"
      @mouseleave="clearSourceTooltipTimer"
      @click="toggleCollapsed"
    >
      <div class="ability-header">
        <span class="caret">{{ caretSymbol }}</span>
        <div class="ability-name-container">
          <span class="ability-name"><strong>{{ ability.name }}</strong></span>
          <button
            class="edit-button"
            @click.stop="$emit('edit', ability)"
            title="Edit ability"
          >
            ✎
          </button>
        </div>
        <div class="ability-info" v-if="traitOrMp">
          <em>{{ traitOrMp }}</em>
        </div>
      </div>
      <transition name="expand">
        <div v-if="!collapsed" class="ability-content">
          <p class="description-background">
            {{ ability.description }}
          </p>
          <button
            v-if="ability.canBeActive"
            class="bottom-buttons toggle-active-button"
            @click.stop="toggleActive"
            :title="isActive ? 'Make inactive' : 'Make active'"
          >
            {{ isActive ? '💨' : '💥' }}
          </button>
          <button
            class="bottom-buttons send-to-chat-button"
            @click.stop="sendAbilityToChat"
            title="Send to chat"
          >
            💬
          </button>
        </div>
      </transition>
      <div v-if="showTooltip" class="tooltip">
        from {{ sourceName }}
      </div>
    </div>
</template>
  
<script>
import AncestryService from "@/services/AncestryService";
import CultureService from "@/services/CultureService";
import MestieriService from "@/services/MestieriService";

export default {
  props: {
    ability: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      collapsed: false,
      color1: "#000000",
      color2: "#000000",
      sourceName: "",
      editButtonIsVisible: false,
      showTooltip: false,
      tooltipTimer: null,
      isActive: this.ability.isActive,
    };
  },
  computed: {
    caretSymbol() {
      return this.collapsed ? "▶" : "▼";
    },
    gradientStyle() {
      return {
        background: `linear-gradient(to bottom right, ${this.color1}, ${this.color2})`,
      };
    },
    traitOrMp() {
      const parts = [];
      if (this.ability.isTrait) parts.push("trait");
      if (this.ability.mp) parts.push(`${this.ability.mp} MP`);
      return parts.join(", ");
    },
  },
  methods: {
    async fetchSourceColorsAndName() {
      try {
        const [ancestries, cultures, mestieri] = await Promise.all([
          AncestryService.getAllAncestries(),
          CultureService.getAllCultures(),
          MestieriService.getAllMestieri(),
        ]);

        const sourceEntity =
          ancestries.find((item) => item.id === this.ability.source) ||
          cultures.find((item) => item.id === this.ability.source) ||
          mestieri.find((item) => item.id === this.ability.source);

        if (sourceEntity) {
          this.color1 = sourceEntity.color1 || "#000000";
          this.color2 = sourceEntity.color2 || "#000000";
          this.sourceName = sourceEntity.name || "Unknown";
        } else {
          console.warn(`Source not found for ability with source ID: ${this.ability.source}`);
          this.color1 = "#000000";
          this.color2 = "#000000";
          this.sourceName = "Unknown";
        }
      } catch (error) {
        console.error("Error fetching source colors and name:", error);
        this.color1 = "#000000";
        this.color2 = "#000000";
        this.sourceName = "Unknown";
      }
    },
    showEditButton() {
      this.editButtonIsVisible = !this.editButtonIsVisible;
    },
    hideEditButton() {
      this.editButtonIsVisible = false;
    },
    toggleCollapsed() {
      this.collapsed = !this.collapsed;
    },
    toggleActive() {
      this.isActive = !this.isActive;
      this.$emit("update", { ...this.ability, isActive: this.isActive });
    },
    sendAbilityToChat() {
      this.$emit("sendToChat", this.ability);
    },
    startSourceTooltipTimer() {
      this.tooltipTimer = setTimeout(() => {
        this.showTooltip = true;
      }, 1500); // Show source tooltip after 1.5 seconds
    },
    clearSourceTooltipTimer() {
      clearTimeout(this.tooltipTimer);
      this.showTooltip = false;
    },
  },
  watch: {
    ability: {
      handler() {
        this.fetchSourceColorsAndName();
      },
      deep: true,
      immediate: true,
    },
  },
  async mounted() {
    await this.fetchSourceColorsAndName();
  },
};
</script>
  
<style scoped>
.ability-card {
  border: 1px solid #555;
  border-radius: 8px;
  padding: 10px;
  margin: 10px 0;
  cursor: pointer;
  color: lightgray;
  transition: background-color 0.3s ease, transform 0.2s ease;
  width: 300px;
  position: relative; /* For tooltip positioning */
}

.ability-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.caret {
  margin-right: 10px;
  font-size: 16px;
  height: 20px;
  width: 20px;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; /* Black outline */
}

.ability-name-container {
  flex: 1;
  margin-right: 10px;
  display: flex;
  align-items: center;
  position: relative;
}

.ability-name {
  font-size: 16px;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; /* Black outline */
  word-wrap: break-word; /* Ensure long names wrap */
}

.edit-button {
  display: none; /* Hidden by default */
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; /* Black outline */
  margin-left: 5px;
  background: none;
  border: none;
  color: lightgray;
  font-size: 14px;
  cursor: pointer;
  transition: text-shadow 0.2s ease-in-out;
}

.ability-card:hover .edit-button {
  display: inline-block; /* Show on hover */
}

.edit-button:hover {
  text-shadow: 0px 0px 5px white;
}

.ability-info {
  font-size: 14px;
  color: lightgray;
  text-shadow: -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000; /* Black outline */
  font-style: italic;
}

.ability-content {
  font-size: 14px;
  color: lightgray;
  overflow: hidden;
  position: relative;
}

.description-background {
  background-color: rgba(0, 0, 0, 0.4);
  padding: 10px;
  border-radius: 5px;
  text-align: left;
}

.bottom-buttons {
  position: absolute;
  bottom: -4px;
  background: none;
  border: none;
  color: lightgray;
  font-size: 16px;
  cursor: pointer;
  padding: 2px;
  transition: text-shadow 0.2s ease-in-out;
}

.bottom-buttons:hover {
  text-shadow: 0px 0px 5px white;
}

.toggle-active-button {
  right: 27px;
}

.send-to-chat-button {
  right: -1px;
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
  pointer-events: none; /* Prevent tooltip from interfering with hover */
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
  max-height: 200px;
}
</style>