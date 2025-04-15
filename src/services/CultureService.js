import axios from 'axios';

class CultureService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/cultures';
  }

  // CRUD METHODS
  async getAllCultures() {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    }
    catch (error) {
      console.error("Error getting all cultures:", error);
      throw error;
    }
  }
  async saveCulture(culture) {
    try {
      await axios.put(`${this.baseUrl}/${culture.id}`, culture);
    } catch (error) {
      console.error("Error saving culture:", error);
    }
  }
  async createCulture() {
    const newCulture = this.getDefaultCulture();
    try {
      const response = await axios.post(this.baseUrl, newCulture);
      return response.data;
    } catch (error) {
      console.error("Error creating new culture:", error);
      throw error;
    }
  }
  async deleteCulture(culture) {
    culture.isDeleted = true;
    this.saveCulture(culture);
  }

  // DEFAULT CULTURE
  static DEFAULT_ART_URL = "https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png";

  getDefaultCulture() {
    return {
      id: null, // ID will be assigned by the backend
      name: "New Culture",
      artUrls: [CultureService.DEFAULT_ART_URL],
      isDeleted: false,
    };
  }
}

export default new CultureService();