import axios from 'axios';

class CultureService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/cultures';
  }

  // DATA READ/WRITE METHODS
  async getAllCultures() {
    const response = await axios.get(this.baseUrl);
    return response.data;
  }
  
  async saveCulture(culture) {
    try {
      await axios.put(`${this.baseUrl}/${culture.id}`, culture);
    } catch (error) {
      console.error("Error saving culture:", error);
    }
  }
}

export default new CultureService();
