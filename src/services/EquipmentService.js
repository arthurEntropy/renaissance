import axios from 'axios';

class EquipmentService {
  constructor() {
    this.baseUrl = 'http://localhost:3000/equipment';
  }

  // CRUD METHODS
  async getAllEquipment() {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error("Error getting all equipment:", error);
      throw error;
    }
  }

  async updateEquipment(equipment) {
    console.log("Updating equipment:", equipment);
    try {
      await axios.put(`${this.baseUrl}/${equipment.id}`, equipment);
    } catch (error) {
      console.error("Error saving equipment:", error);
    }
  }

  async createEquipment() {
    const newEquipment = this.getDefaultEquipment();
    try {
      const response = await axios.post(this.baseUrl, newEquipment);
      return response.data;
    } catch (error) {
      console.error("Error creating new equipment:", error);
      throw error;
    }
  }

  async createCustomEquipment() {
    console.log("Creating custom equipment...");
    const customEquipment = this.getDefaultEquipment();
  
    // Explicitly set these properties
    customEquipment.isCustom = true;
    customEquipment.name = "New Custom Item";
  
    try {
      const response = await axios.post(this.baseUrl, customEquipment);
  
      // Merge the response data with the default schema to ensure all fields are present
      const data = { ...this.getDefaultEquipment(), ...response.data };
  
      // Ensure isCustom and name are set correctly
      data.isCustom = true;
      data.name = data.name || "New Custom Item";
  
      return data;
    } catch (error) {
      console.error("Error creating custom equipment:", error);
      throw error;
    }
  }

  async deleteEquipment(equipment) {
    equipment.isDeleted = true;
    this.updateEquipment(equipment);
  }

  // DEFAULT EQUIPMENT
  getDefaultEquipment() {
    return {
      id: null, // ID will be assigned by the backend
      name: "New Item",
      description: "",
      standardOfLiving: null,
      source: null,
      weight: 0,
      isMelee: false,
      damageDice: [],
      engagementDice: [],
      engagementSuccesses: [],
      skillMods: [],
      isDeleted: false,
      isCustom: false,
      artUrl: null
    };
  }
}

export default new EquipmentService();