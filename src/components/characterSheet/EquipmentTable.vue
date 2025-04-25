<template>
  <div class="equipment-table">

    <!-- TITLE -->
    <h2>EQUIPMENT</h2>

    <!-- ITEM ROWS -->
    <div
      v-for="(row, index) in characterEquipmentRows"
      :key="row.id"
      class="equipment-row"
    >
      <!-- EquipmentCard (collapsed/minimal) -->
      <EquipmentCard
        v-if="row.equipment"
        :equipment="row.equipment"
        :collapsed="true"
        class="equipment-card"
      />
      <span v-else class="missing-equipment">Unknown item</span>

      <div class="equipment-row-details">
        <!-- Quantity -->
        <em> x </em>
        <input
          type="number"
          v-model.number="row.quantity"
          min="1"
          class="input-small quantity-input"
          @input="updateEquipmentItem(index, 'quantity', Math.max(1, row.quantity))"
        />

        <!-- Carried Weight -->
        <em> = </em>
        <div>
          <span>
            {{ row.isCarried && row.equipment ? formatWeight(row.equipment.weight * row.quantity) : '0' }}
          </span>
          <em> lbs</em>
        </div>

        <!-- Carried Checkbox -->
        <div>
          <input
            type="checkbox"
            v-model="row.isCarried"
            @change="updateEquipmentItem(index, 'isCarried', row.isCarried)"
          />
          <em> carried</em>
        </div>

        <!-- Delete Button -->
        <span @click="removeEquipmentItem(index)" class="delete-item-link">ⓧ</span>
      </div>
    </div>

    <!-- ADD ITEM ROW -->
    <!-- <div class="equipment-row">
      <span @click="addEquipmentItem()" class="add-item-link">+</span>
    </div> -->

    <!-- TOTAL WEIGHT ROW -->
    <div class="equipment-row total-weight-row">
      <span class="total-weight-carried">Total Weight Carried:</span>
      <span class="equipment-lbs-carried">{{ totalWeightCarried }} lbs</span>
    </div>
  </div>
</template>

<script>
  import CharacterService from "@/services/CharacterService";
  import EquipmentCard from "@/components/EquipmentCard.vue";

  export default {
    props: {
      equipment: Array,
      allEquipment: Array,
      character: Object,
    },
    emits: ["update-character"],
    components: {
      EquipmentCard,
    },
    computed: {
      characterEquipmentRows() {
        const allEquipment = this.allEquipment || [];
        return this.character.equipment.map(entry => {
          const equipment = allEquipment.find(eq => eq.id === entry.id);
          return {
            ...entry,
            equipment,
          };
        });
      },
      totalWeightCarried() {
        return Math.round(
          this.characterEquipmentRows.reduce((sum, row) => {
            if (!row.equipment) return sum;
            return row.isCarried ? sum + (row.equipment.weight * row.quantity) : sum;
          }, 0)
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
  h2 {
    margin: 5px;
  }
  .equipment-table {
    display: flex;
    flex-direction: column;
    align-items: left;
    width: 600px;
    margin: 20px;
  }
  .equipment-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: left;
    width: 100%;
    flex-wrap: wrap;
    margin-bottom: 10px;
  }
  .equipment-card {
    width: 300px;
    max-width: 300px;
    min-width: 300px;
    padding: 7px;
    text-align: left;
  }
  .equipment-row-details {
    display: flex;
    flex-direction: row;
    justify-content: space-evenly;
    align-items: center;
    width: 275px;
    padding-top: 5px;
  }
  .quantity-input {
    margin-left: 2px;
  }
  .total-weight-row {
    display: flex;
    flex-direction: row;
    justify-content: right;
  }
  .total-weight-carried {
    font-size: 18px;
    font-weight: bold;
    margin-right: 20px;
  }
  .equipment-lbs-carried {
    font-size: 18px;
    font-weight: bold;
    margin-right: 50px;
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