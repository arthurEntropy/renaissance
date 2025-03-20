import axios from 'axios';

class CharacterService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/characters';
  }

  async fetchCharacters() {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching characters:", error);
      return [];
    }
  }

  async updateCharacter(character) {
    console.log("updateCharacter called with:", character); // Debugging log
    try {
      await axios.put(`${this.baseUrl}/${character.id}`, character);
    } catch (error) {
      console.error("Error updating character:", error);
    }
  }
}

export default new CharacterService();