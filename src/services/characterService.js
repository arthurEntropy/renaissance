import axios from 'axios';

export const useFetchCharacters = async () => {
  try {
    const response = await axios.get('http://localhost:3000/characters');
    return response.data;
  } catch (error) {
    console.error("Error fetching characters:", error);
    return [];
  }
};

export const updateCharacter = async (character) => {
    console.log("updateCharacter called with:", character); // Debugging log
    try {
        await axios.put(`http://localhost:3000/characters/${character.id}`, character);
    } catch (error) {
        console.error("Error updating character:", error);
    }
};
