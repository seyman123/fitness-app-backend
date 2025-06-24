const { Food } = require('../models');

const defaultFoods = [
  // Fruits
  { name: 'Elma', category: 'fruits', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, servingSize: 100, isVerified: true },
  { name: 'Muz', category: 'fruits', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, servingSize: 100, isVerified: true },
  { name: 'Portakal', category: 'fruits', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, servingSize: 100, isVerified: true },
  
  // Vegetables
  { name: 'Brokoli', category: 'vegetables', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, servingSize: 100, isVerified: true },
  { name: 'Havuç', category: 'vegetables', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, servingSize: 100, isVerified: true },
  { name: 'Domates', category: 'vegetables', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, servingSize: 100, isVerified: true },
  
  // Proteins
  { name: 'Tavuk Göğsü', category: 'meat', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: 100, isVerified: true },
  { name: 'Somon', category: 'meat', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: 100, isVerified: true },
  { name: 'Yumurta', category: 'meat', calories: 155, protein: 13, carbs: 1.1, fat: 11, servingSize: 100, isVerified: true },
  
  // Dairy
  { name: 'Süt', category: 'dairy', calories: 42, protein: 3.4, carbs: 5, fat: 1, servingSize: 100, isVerified: true },
  { name: 'Yoğurt', category: 'dairy', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: 100, isVerified: true },
  { name: 'Peynir', category: 'dairy', calories: 113, protein: 25, carbs: 4.1, fat: 0.3, servingSize: 100, isVerified: true },
  
  // Grains
  { name: 'Beyaz Pirinç', category: 'grains', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: 100, isVerified: true },
  { name: 'Makarna', category: 'grains', calories: 131, protein: 5, carbs: 25, fat: 1.1, servingSize: 100, isVerified: true },
  { name: 'Ekmek', category: 'grains', calories: 265, protein: 9, carbs: 49, fat: 3.2, servingSize: 100, isVerified: true },
  
  // Nuts and Seeds
  { name: 'Badem', category: 'nuts', calories: 579, protein: 21, carbs: 22, fat: 50, servingSize: 100, isVerified: true },
  { name: 'Ceviz', category: 'nuts', calories: 654, protein: 15, carbs: 14, fat: 65, servingSize: 100, isVerified: true },
  
  // Beverages
  { name: 'Su', category: 'beverages', calories: 0, protein: 0, carbs: 0, fat: 0, servingSize: 100, isVerified: true },
  { name: 'Çay', category: 'beverages', calories: 1, protein: 0, carbs: 0.3, fat: 0, servingSize: 100, isVerified: true },
  { name: 'Kahve', category: 'beverages', calories: 2, protein: 0.3, carbs: 0, fat: 0, servingSize: 100, isVerified: true },
];

class FoodSeeder {
  static async seedDefaultFoods() {
    try {
      console.log('Seeding default foods...');
      
      for (const foodData of defaultFoods) {
        const existing = await Food.findOne({
          where: { name: foodData.name, isVerified: true }
        });

        if (!existing) {
          await Food.create(foodData);
          console.log(`Created food: ${foodData.name}`);
        }
      }
      
      console.log('Default foods seeded successfully');
    } catch (error) {
      console.error('Error seeding default foods:', error);
    }
  }

  static async run() {
    await this.seedDefaultFoods();
  }
}

module.exports = FoodSeeder; 