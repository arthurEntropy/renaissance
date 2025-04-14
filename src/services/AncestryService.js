import axios from 'axios';

class AncestryService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/ancestries';
  }

  // CRUD METHODS
  async getAllAncestries() {
    const response = await axios.get(this.baseUrl);
    return response.data;
  }
  async saveAncestry(ancestry) {
    try {
      await axios.put(`${this.baseUrl}/${ancestry.id}`, ancestry);
    } catch (error) {
      console.error("Error saving ancestry:", error);
    }
  }
  async createNewAncestry() {
    const newAncestry = this.getDefaultAncestry();
    try {
      const response = await axios.post(this.baseUrl, newAncestry);
      return response.data;
    } catch (error) {
      console.error("Error creating new ancestry:", error);
      throw error;
    }
  }
  async deleteAncestry(ancestry) {
    ancestry.isDeleted = true;
    this.saveAncestry(ancestry);
  }

  // DEFAULT ANCESTRY
  static DEFAULT_ART_URL = "https://cdn.midjourney.com/a8a36740-b7d3-4aef-bea3-a95039bec06f/0_2.png";

  getDefaultAncestry() {
    return {
      "id": null, // ID will be assigned by the backend
      "name": "New Ancestry",
      artUrls: [AncestryService.DEFAULT_ART_URL],
    }
  }
}

export default new AncestryService();
