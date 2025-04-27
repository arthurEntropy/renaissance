import axios from 'axios';

class MestieriService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/mestieri';
  }

  // CRUD METHODS
  async getAllMestieri() {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error getting all mestieri:", error);
      throw error;
    }
  }

  async saveMestiere(mestiere) {
    try {
      await axios.put(`${this.baseUrl}/${mestiere.id}`, mestiere);
    } catch (error) {
      console.error("Error saving mestiere:", error);
    }
  }

  async createMestiere() {
    const newMestiere = this.getDefaultMestiere();
    try {
      const response = await axios.post(this.baseUrl, newMestiere);
      return response.data;
    } catch (error) {
      console.error("Error creating new mestiere:", error);
      throw error;
    }
  }

  async deleteMestiere(mestiere) {
    mestiere.isDeleted = true;
    this.saveMestiere(mestiere);
  }

  // DEFAULT MESTIERE
  static DEFAULT_ART_URL = "https://cdn.midjourney.com/default-mestiere-art.png";

  getDefaultMestiere() {
    return {
      id: null, // ID will be assigned by the backend
      name: "New Mestiere",
      artUrls: [MestieriService.DEFAULT_ART_URL],
      color1: "#000000", // Default color1 (black)
      color2: "#FFFFFF", // Default color2 (white)
      isDeleted: false,
    };
  }
}

export default new MestieriService();