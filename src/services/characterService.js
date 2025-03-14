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
