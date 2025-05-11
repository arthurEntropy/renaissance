import axios from 'axios';

class RulesService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/rules';
  }

  async getAllSections() {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error getting all sections:", error);
      throw error;
    }
  }

  async createSection(sectionData = {}) {
    const defaultSection = {
      name: "New Section",
      content: "",
      index: 0,
      isDeleted: false,
      ...sectionData
    };
    
    try {
      const response = await axios.post(this.baseUrl, defaultSection);
      return response.data;
    } catch (error) {
      console.error("Error creating new section:", error);
      throw error;
    }
  }

  async updateSection(section) {
    try {
      const response = await axios.put(`${this.baseUrl}/${section.id}`, section);
      return response.data;
    } catch (error) {
      console.error("Error updating section:", error);
      throw error;
    }
  }

  async deleteSection(section) {
    try {
      // Soft delete by marking as deleted
      section.isDeleted = true;
      return await this.updateSection(section);
    } catch (error) {
      console.error("Error deleting section:", error);
      throw error;
    }
  }

  async reorderSections(sections) {
    try {
      // Instead of a dedicated endpoint, update each section with its new index
      const updatePromises = sections.map((section, index) => {
        const updatedSection = { ...section, index };
        return this.updateSection(updatedSection);
      });
      
      await Promise.all(updatePromises);
      return sections; // Return the reordered sections
    } catch (error) {
      console.error("Error reordering sections:", error);
      throw error;
    }
  }
}

export default new RulesService();