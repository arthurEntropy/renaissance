import axios from 'axios';

class AncestryService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/ancestries';
  }

  // DATA READ/WRITE METHODS
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
}

export default new AncestryService();
