<template>
  <div class="equipment-table">

    <!-- TITLE -->
    <h2>EQUIPMENT</h2>

    <!-- HEADER ROW -->
    <div class="equipment-header-row">
      <span class="equipment-header">item</span>
      <span class="equipment-header">lbs</span>
      <span class="equipment-header">qty</span>
      <span class="equipment-header-angled">carried</span>
      <span class="equipment-header-angled">lbs carried</span>
    </div>

    <!-- ITEM ROWS -->
    <div
      v-for="(item, index) in equipment"
      :key="index"
      class="equipment-row"
    >
      <!--Item Name-->
      <input
        type="text"
        v-model="item.name"
        class="input-small equipment-item-name-input"
        @change="updateEquipmentItem(index, 'name', item.name)"
      />
      <!--Weight-->
      <input
        type="number"
        v-model.number="item.weight"
        class="input-small"
        @input="updateEquipmentItem(index, 'weight', Math.max(0, item.weight))"
      />
      <!--Quantity-->
      <input
        type="number"
        v-model.number="item.quantity"
        class="input-small"
        @input="updateEquipmentItem(index, 'quantity', Math.max(0, item.quantity))"
      />
      <!--Carried Checkbox-->
      <input
        type="checkbox"
        v-model="item.carried"
        @change="updateEquipmentItem(index, 'carried', item.carried)"
      />
      <!--Carried Weight-->
      <span class="equipment-lbs-carried">
        {{ item.carried ? formatWeight(item.weight * item.quantity) : '0' }}
      </span>
      <!--Delete Button-->
      <span @click="removeEquipmentItem(index)" class="delete-item-link">ⓧ</span>
    </div>

    <!-- ADD ITEM ROW -->
    <div class="equipment-row">
      <span></span> <!-- Empty span for alignment -->
      <span></span> <!-- Empty span for alignment -->
      <span></span> <!-- Empty span for alignment -->
      <span></span> <!-- Empty span for alignment -->
      <span></span> <!-- Empty span for alignment -->
      <span @click="addEquipmentItem()" class="add-item-link">+</span>
    </div>

    <!-- TOTAL WEIGHT ROW -->
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
  import CharacterService from "@/services/CharacterService";

  export default {
    props: {
      equipment: {
        type: Array,
        required: true,
      },
      character: {
        type: Object,
        required: true,
      },
    },
    emits: ["update-character"],
    computed: {
      totalWeightCarried() {
        return Math.round(
          this.equipment.reduce((sum, item) => {
            return item.carried ? sum + item.weight * item.quantity : sum;
          }, 0) // Rounded to the nearest whole number
        );
      },
    },
    methods: {
      updateEquipmentItem(index, key, value) {
        CharacterService.updateEquipmentItem(this.character, index, key, value);
        this.$emit("update-character", this.character);
      },
      removeEquipmentItem(index) {
        CharacterService.removeEquipmentItem(this.character, index);
        this.$emit("update-character", this.character);
      },
      addEquipmentItem() {
        CharacterService.addEquipmentItem(this.character);
        this.$emit("update-character", this.character);
      },
      formatWeight(value) {
        return Number.isInteger(value) ? value : value.toFixed(1); // Format to one decimal place
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