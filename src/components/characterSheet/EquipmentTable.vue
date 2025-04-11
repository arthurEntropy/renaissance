<template>
    <div class="equipment-table">
      <!-- Title Row -->
      <h2>EQUIPMENT</h2>
  
      <!-- Header Row -->
      <div class="equipment-header-row">
        <span class="equipment-header">item</span>
        <span class="equipment-header">lbs</span>
        <span class="equipment-header">qty</span>
        <span class="equipment-header-angled">carried</span>
        <span class="equipment-header-angled">lbs carried</span>
      </div>
  
      <!-- Equipment Item Rows -->
      <div
        v-for="(item, index) in equipment"
        :key="index"
        class="equipment-row"
      >
        <input
          type="text"
          v-model="item.name"
          class="input-small equipment-item-name-input"
          @change="updateEquipmentItem(index, 'name', item.name)"
        />
        <input
          type="number"
          v-model.number="item.weight"
          class="input-small"
          @input="updateEquipmentItem(index, 'weight', Math.max(0, item.weight))"
        />
        <input
          type="number"
          v-model.number="item.quantity"
          class="input-small"
          @input="updateEquipmentItem(index, 'quantity', Math.max(0, item.quantity))"
        />
        <input
          type="checkbox"
          v-model="item.carried"
          @change="updateEquipmentItem(index, 'carried', item.carried)"
        />
        <span class="equipment-lbs-carried">
          {{ item.carried ? formatWeight(item.weight * item.quantity) : '0' }}
        </span>
        <span
          @click="removeEquipmentItem(index)"
          class="delete-item-link"
        >
          ⓧ
        </span>
      </div>
  
      <!-- Add Item Row -->
      <div class="equipment-row">
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
        <span @click="addEquipmentItem()" class="add-item-link">+</span>
      </div>
  
      <!-- Total Weight Row -->
      <div class="equipment-row total-weight-row">
        <span>Total Weight Carried</span>
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
        <span></span> <!-- Empty span for alignment -->
        <span class="equipment-lbs-carried">{{ totalWeightCarried }}</span>
        <span></span> <!-- Empty span for alignment -->
      </div>
    </div>
  </template>

<script>
export default {
  props: {
    equipment: {
      type: Array,
      required: true,
    },
    totalWeightCarried: {
      type: Number,
      required: true,
    },
  },
  emits: ['update-item', 'remove-item', 'add-item'],
  methods: {
    updateEquipmentItem(index, key, value) {
      this.$emit('update-item', index, key, value);
    },
    removeEquipmentItem(index) {
      this.$emit('remove-item', index);
    },
    addEquipmentItem() {
      this.$emit('add-item');
    },
    formatWeight(value) {
      return Number.isInteger(value) ? value : value.toFixed(1);
    },
  },
};
</script>

<style scoped>
.equipment-table {
  display: flex;
  flex-direction: column;
  align-items: left;
  flex: 1;
  max-width: 400px;
  margin: 20px;
}

.equipment-header-row {
  font-size: 14px;
  font-style: italic;
  height: 28px;
  text-decoration: underline;
  text-align: left;
  display: grid;
  grid-template-columns: 50% 13% 13% 8% 8% 3%;
}

.equipment-header {
  padding: 0 0 0 5px;
}

.equipment-header-angled {
  transform: rotate(-45deg);
  transform-origin: left bottom;
  white-space: nowrap;
  display: inline-block;
  margin-left: 20px;
}

.equipment-row {
  display: grid;
  grid-template-columns: 50% 13% 13% 8% 8% 3%;
  align-items: center;
  margin-bottom: 10px;
  height: 30px;
}

.total-weight-row {
  border-top: 1px solid lightgray;
}

.equipment-lbs-carried {
  text-align: center;
  font-size: 14px;
  font-weight: bold;
}

.delete-item-link {
  cursor: pointer;
  color: gray;
  font-size: 15px;
  text-align: center;
  margin: 0 0 -1px 10px;
}

.add-item-link {
  cursor: pointer;
  color: gray;
  font-size: 20px;
  padding-left: 12px;
}
</style>