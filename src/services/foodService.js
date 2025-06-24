const axios = require('axios');

const { Food } = require('../models');

class FoodService {
  constructor() {
    this.apiKey = process.env.FOOD_API_KEY;
    this.apiUrl = process.env.FOOD_API_URL;
  }

  /**
   * Search food by barcode using external API
   * @param {string} barcode - Food barcode
   * @returns {Object|null} Food data or null if not found
   */
  async searchByBarcode(barcode) {
    try {
      // First check local database
      const localFood = await Food.findOne({ where: { barcode } });
      if (localFood) {
        return localFood;
      }

      // If not found locally and API is configured, search external API
      if (this.apiKey && this.apiUrl) {
        const response = await axios.get(`${this.apiUrl}/barcode/${barcode}`, {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });

        if (response.data && response.data.product) {
          const product = response.data.product;
          
          // Save to local database for future use
          const foodData = await this.normalizeExternalFood(product);
          const savedFood = await Food.create(foodData);
          return savedFood;
        }
      }

      return null;
    } catch (error) {
      console.error('Barcode search error:', error.message);
      return null;
    }
  }

  /**
   * Search food by name using external API
   * @param {string} searchTerm - Food name to search
   * @param {number} limit - Number of results to return
   * @returns {Array} Array of food items
   */
  async searchByName(searchTerm, limit = 10) {
    try {
      // First search local database
      const localFoods = await this.searchLocalFoods(searchTerm, Math.min(limit, 5));
      
      // If API is configured and we need more results, search external API
      if (this.apiKey && this.apiUrl && localFoods.length < limit) {
        const remainingLimit = limit - localFoods.length;
        const externalFoods = await this.searchExternalFoods(searchTerm, remainingLimit);
        return [...localFoods, ...externalFoods];
      }

      return localFoods;
    } catch (error) {
      console.error('Food search error:', error.message);
      return [];
    }
  }

  /**
   * Search local database for foods
   * @param {string} searchTerm - Search term
   * @param {number} limit - Limit results
   * @returns {Array} Local food results
   */
  async searchLocalFoods(searchTerm, limit) {
    const { Op } = require('sequelize');
    
    return await Food.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: `%${searchTerm}%` } },
          { brand: { [Op.like]: `%${searchTerm}%` } }
        ]
      },
      limit,
      order: [['isVerified', 'DESC'], ['name', 'ASC']]
    });
  }

  /**
   * Search external API for foods
   * @param {string} searchTerm - Search term
   * @param {number} limit - Limit results
   * @returns {Array} External food results
   */
  async searchExternalFoods(searchTerm, limit) {
    try {
      const response = await axios.get(`${this.apiUrl}/search`, {
        params: {
          q: searchTerm,
          limit
        },
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      if (response.data && response.data.foods) {
        // Normalize external foods and optionally save popular ones
        return await Promise.all(
          response.data.foods.map(food => this.normalizeExternalFood(food))
        );
      }

      return [];
    } catch (error) {
      console.error('External food search error:', error.message);
      return [];
    }
  }

  /**
   * Normalize external food data to our format
   * @param {Object} externalFood - External food object
   * @returns {Object} Normalized food object
   */
  async normalizeExternalFood(externalFood) {
    return {
      name: externalFood.name || externalFood.product_name,
      brand: externalFood.brand || externalFood.brands,
      barcode: externalFood.barcode || externalFood.code,
      servingSize: externalFood.serving_size || 100,
      calories: this.parseNutrientValue(externalFood.calories || externalFood.energy),
      protein: this.parseNutrientValue(externalFood.protein),
      carbs: this.parseNutrientValue(externalFood.carbs || externalFood.carbohydrates),
      fat: this.parseNutrientValue(externalFood.fat),
      fiber: this.parseNutrientValue(externalFood.fiber),
      sugar: this.parseNutrientValue(externalFood.sugar),
      sodium: this.parseNutrientValue(externalFood.sodium),
      category: this.categorizeFood(externalFood.categories || externalFood.category),
      isVerified: true // External API foods are considered verified
    };
  }

  /**
   * Parse nutrient value from various formats
   * @param {any} value - Nutrient value
   * @returns {number} Parsed numeric value
   */
  parseNutrientValue(value) {
    if (!value) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  }

  /**
   * Categorize food based on external categories
   * @param {string|Array} categories - Food categories
   * @returns {string} Normalized category
   */
  categorizeFood(categories) {
    if (!categories) return 'other';
    
    const categoryString = Array.isArray(categories) 
      ? categories.join(' ').toLowerCase() 
      : categories.toLowerCase();

    if (categoryString.includes('fruit')) return 'fruits';
    if (categoryString.includes('vegetable')) return 'vegetables';
    if (categoryString.includes('meat') || categoryString.includes('chicken') || categoryString.includes('beef')) return 'meat';
    if (categoryString.includes('dairy') || categoryString.includes('milk') || categoryString.includes('cheese')) return 'dairy';
    if (categoryString.includes('grain') || categoryString.includes('bread') || categoryString.includes('cereal')) return 'grains';
    if (categoryString.includes('beverage') || categoryString.includes('drink')) return 'beverages';
    if (categoryString.includes('snack') || categoryString.includes('candy')) return 'snacks';
    
    return 'other';
  }

  /**
   * Get popular foods for suggestions
   * @param {number} limit - Number of foods to return
   * @returns {Array} Popular foods
   */
  async getPopularFoods(limit = 20) {
    return await Food.findAll({
      where: { isVerified: true },
      limit,
      order: [['createdAt', 'DESC']]
    });
  }
}

module.exports = new FoodService(); 
