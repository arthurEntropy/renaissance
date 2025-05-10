import axios from 'axios';

class RulesService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/rules';
  }

  // CRUD METHODS
  async getAllSections() {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error getting all sections:", error);
      throw error;
    }
  }

  async updateSection(section) {
    try {
      await axios.put(`${this.baseUrl}/${section.id}`, section);
      return section;
    } catch (error) {
      console.error("Error saving section:", error);
      throw error;
    }
  }

  async createSection(sectionData) {
    const newSection = this.getDefaultSection(sectionData);
    try {
      const response = await axios.post(this.baseUrl, newSection);
      return response.data;
    } catch (error) {
      console.error("Error creating new section:", error);
      throw error;
    }
  }

  async deleteSection(id) {
    try {
      await axios.delete(`${this.baseUrl}/${id}`);
    } catch (error) {
      console.error("Error deleting section:", error);
      throw error;
    }
  }

  async reorderSections(orderedIds) {
    try {
      await axios.post(`${this.baseUrl}/reorder`, { orderedIds });
    } catch (error) {
      console.error("Error reordering sections:", error);
      throw error;
    }
  }

  // DEFAULT SECTION
  getDefaultSection(overrides = {}) {
    return {
      id: null, // ID will be assigned by the backend
      title: "New Section",
      content: "",
      index: 0,
      ...overrides
    };
  }
}

export default new RulesService();