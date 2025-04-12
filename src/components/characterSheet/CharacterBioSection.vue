<template>
  <div class="character-bio-section">
    
    <!-- Character Art -->
    <div class="character-art">
      <img
        v-if="character.artUrls"
        :src="character.artUrls[0] || defaultArtUrl"
        class="character-art-image"
        @click="openFullSizeCharacterArtModal(character.artUrls[0])"
      />
      <p v-else>No character art available</p>
    </div>

    <!-- Bio Fields -->
    <div class="bio-fields">
      <div class="bio-field">
        <label>
          Name:
          <input
            type="text"
            :value="character.name"
            @input="updateField('name', $event.target.value)"
            class="bio-input-field"
          />
        </label>
      </div>
      <div class="bio-field">
        <label>
          Pronouns:
          <input
            type="text"
            :value="character.pronouns"
            @input="updateField('pronouns', $event.target.value)"
            class="bio-input-field"
          />
        </label>
      </div>
      <div class="bio-field">
        <label>
          Ancestry:
          <input
            type="text"
            :value="character.ancestries"
            @input="updateField('ancestries', $event.target.value)"
            class="bio-input-field"
          />
        </label>
      </div>
      <div class="bio-field">
        <label>
          Culture(s):
          <input
            type="text"
            :value="character.cultures"
            @input="updateField('cultures', $event.target.value)"
            class="bio-input-field"
          />
        </label>
      </div>
    </div>

    <!-- Personality and Background -->
    <label class="personality-and-background">
      Personality & Background:
      <textarea
        :value="character.personalityAndBackground"
        @input="updateField('personalityAndBackground', $event.target.value)"
        class="personality-and-background-textarea"
      ></textarea>
    </label>
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
    emits: ["open-full-size-art", "update-character"],
    methods: {
      openFullSizeCharacterArtModal(imageUrl) {
        this.$emit("open-full-size-art", imageUrl);
      },
      updateField(key, value) {
        const updatedCharacter = { ...this.character, [key]: value };
        this.$emit("update-character", updatedCharacter);
      },
    },
  };
</script>

<style scoped>
  .character-bio-section {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-bottom: 10px;
  }
  .character-art {
    position: relative;
    text-align: center;
    cursor: pointer;
    margin: 20px 20px 20px 0;
  }
  .character-art-image {
    max-width: 150px;
    max-height: 150px;
    object-fit: cover;
  }
  .bio-fields {
    display: flex;
    flex-direction: column;
    margin: 0 20px;
  }
  .bio-field {
    display: flex;
    flex-wrap: nowrap;
  }
  .bio-input-field {
    background: black;
    color: lightgray;
    padding: 3px;
    font-size: 18px;
    margin: 3px 3px 3px 10px;
  }
  .personality-and-background {
    display: flex;
    height: 155px;
    width: 300px;
    flex-direction: column;
  }
  .personality-and-background-textarea {
    color: lightgray;
    padding: 5px;
    resize: none;
    border-radius: 4px;
    line-height: 1.4;
    margin-top: 10px;
    height: 100%;
    width: 90%;
  }
  @media (max-width: 567px) {
    .bio-fields {
      align-items: center;
    }
    .personality-and-background {
      margin-top: 20px;
    }
  }
</style>