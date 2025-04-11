<template>
  <div class="core-ability-column">
    <!-- Core Ability Header -->
    <div class="core-ability-header">
      <h2>{{ title }}</h2>
      <input
        type="number"
        :value="coreAbilityValue"
        @input="$emit('update-core-ability', $event.target.value)"
        class="input-large"
        min="0"
      />
    </div>

    <!-- Skills -->
    <div
      v-for="(skill) in skills"
      :key="skill.name"
      class="skill-row"
    >
      <span
        class="skill-name-clickable"
        @click="$emit('open-skill-check', skill.name)"
      >
        {{ skill.name }}
      </span>
      <span class="d12-symbol" :class="getFavoredClass(skill)">⭓</span>
      <div class="skill-checkbox-group">
        <input
          v-for="(n, checkboxIndex) in 5"
          :key="checkboxIndex"
          type="checkbox"
          :checked="isCheckboxChecked(skill, checkboxIndex)"
          @click="$emit('update-skill-checkbox', skill.name, checkboxIndex)"
          class="skill-checkbox"
          :class="getSkillCheckboxDiceModClass(skill, checkboxIndex)"
        />
      </div>
    </div>

    <!-- Additional Rows -->
    <div v-for="row in additionalRows" :key="row.label" class="virtue-row">
      <span class="skill-name">{{ row.label }}</span>
      <template v-if="row.type === 'number'">
        <input
          type="number"
          :value="row.value.current"
          @input="$emit('update-additional-row', row.key, 'current', $event.target.value)"
          class="input-small"
          min="0"
        />
        <span>/</span>
        <input
          type="number"
          :value="row.value.max"
          @input="$emit('update-additional-row', row.key, 'max', $event.target.value)"
          class="input-small"
          min="0"
        />
      </template>
      <template v-else-if="row.type === 'state'">
        <div class="state-row">
          <span class="skill-name">{{ row.label }}</span>
          <input
            type="checkbox"
            :checked="row.value.first"
            @change="$emit('update-additional-row', row.key, 'first', $event.target.checked)"
            class="skill-checkbox"
          />
          <input
            type="checkbox"
            :checked="row.value.second"
            @change="$emit('update-additional-row', row.key, 'second', $event.target.checked)"
            class="skill-checkbox"
          />
          <span></span> <!-- Empty span for alignment -->
          <span></span> <!-- Empty span for alignment -->
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    character: {
      type: Object,
      required: true,
    },
    defaultArtUrl: {
      type: String,
      required: true,
    },
  },
  emits: ['open-full-size-art', 'update-character'],
  methods: {
    openFullSizeCharacterArtModal(imageUrl) {
      this.$emit('open-full-size-art', imageUrl);
    },
  },
};
</script>

<style scoped>
.core-ability-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 300px;
  margin: 10px 30px;
}

.core-ability-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  height: 28px;
}

.skill-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin: 5px 0;
  height: 25px;
}

.skill-name-clickable {
  color: rgb(212, 182, 106);
  text-align: left;
  flex: 1;
  max-width: 85px;
  cursor: pointer;
  transition: color 0.2s ease-in-out;
}

.skill-name-clickable:hover {
  color: white;
  text-shadow: 0px 0px 5px goldenrod;
}

.d12-symbol {
  margin-left: auto;
  margin-right: 8px;
  font-size: 18px;
  width: 25px;
  text-align: center;
  border-radius: 5px;
}

.favored {
  background-color: rgb(110, 221, 110);
  color: black;
}

.ill-favored {
  background-color: rgb(254, 135, 135);
  color: black;
}

.skill-checkbox-group {
  display: flex;
  gap: 5px;
  margin: 0 4px;
}

.virtue-row, .weakness-row, .state-row {
  display: grid;
  align-items: left;
  height: 25px;
  width: 100%;
  margin-top: 10px;
}

.virtue-row, .weakness-row {
  grid-template-columns: 35% 20% 5% 20% 20%;
}

.state-row {
  grid-template-columns: 35% 10% 10% 45%;
}

.skill-checkbox {
  margin-left: 5px;
}
</style>