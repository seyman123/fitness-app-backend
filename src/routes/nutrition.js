const express = require('express');
const router = express.Router();
const { Food, FoodEntry, User } = require('../models');
const protect = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');
const foodService = require('../services/foodService');

// GET /api/nutrition/foods - Search foods with enhanced search capabilities
router.get('/foods', async (req, res) => {
  try {
    const { search, category, barcode, limit = 20, offset = 0 } = req.query;
    
    let foods = [];
    let total = 0;
    
    // Barcode search has highest priority
    if (barcode) {
      console.log('Searching for barcode:', barcode);
      const food = await foodService.searchByBarcode(barcode);
      foods = food ? [food] : [];
      total = foods.length;
    } else if (search) {
      // Enhanced text search using food service
      console.log('Searching for food:', search);
      const searchResults = await foodService.searchByName(search, parseInt(limit));
      
      // Filter by category if specified
      if (category) {
        foods = searchResults.filter(food => food.category === category);
      } else {
        foods = searchResults;
      }
      
      // Apply pagination to the filtered results
      const startIndex = parseInt(offset);
      const endIndex = startIndex + parseInt(limit);
      total = foods.length;
      foods = foods.slice(startIndex, endIndex);
    } else {
      // No search term, get foods by category or popular foods
      const whereClause = {};
      if (category) whereClause.category = category;

      const result = await Food.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['isVerified', 'DESC'], ['name', 'ASC']]
      });
      
      foods = result.rows;
      total = result.count;
    }

    res.json({
      success: true,
      data: {
        foods: foods,
        total: total,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(total / limit),
        searchType: barcode ? 'barcode' : search ? 'text' : 'browse'
      }
    });
  } catch (err) {
    console.error('GET Foods Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yiyecekler getirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/nutrition/foods/popular - Get popular foods
router.get('/foods/popular', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const foods = await foodService.getPopularFoods(parseInt(limit));
    
    res.json({
      success: true,
      data: {
        foods: foods,
        total: foods.length
      }
    });
  } catch (err) {
    console.error('GET Popular Foods Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Popüler yiyecekler getirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/nutrition/foods/:id - Get specific food
router.get('/foods/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const food = await Food.findByPk(id);
    if (!food) {
      return res.status(404).json({ 
        success: false, 
        message: 'Yiyecek bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      data: food 
    });
  } catch (err) {
    console.error('GET Food Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yiyecek getirilirken bir hata oluştu' 
    });
  }
});

// POST /api/nutrition/foods - Add new food (protected)
router.post('/foods', protect, async (req, res) => {
  try {
    const { 
      name, 
      brand, 
      barcode, 
      servingSize, 
      calories, 
      protein, 
      carbs, 
      fat, 
      fiber, 
      sugar, 
      sodium, 
      category 
    } = req.body;

    if (!name || !calories) {
      return res.status(400).json({ 
        success: false, 
        message: 'Yiyecek adı ve kalori bilgisi gerekli' 
      });
    }

    const food = await Food.create({
      name,
      brand,
      barcode,
      servingSize: servingSize || 100,
      calories,
      protein: protein || 0,
      carbs: carbs || 0,
      fat: fat || 0,
      fiber: fiber || 0,
      sugar: sugar || 0,
      sodium: sodium || 0,
      category,
      isVerified: false // User-added foods are not verified by default
    });

    res.status(201).json({ 
      success: true, 
      data: food,
      message: 'Yeni yiyecek eklendi' 
    });
  } catch (err) {
    console.error('POST Food Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Yiyecek eklenirken bir hata oluştu' 
    });
  }
});

// GET /api/nutrition/entries - Get user's food entries
router.get('/entries', protect, async (req, res) => {
  try {
    const { date, meal, limit = 50, offset = 0 } = req.query;
    
    console.log('Fetching nutrition entries for user:', req.user.id, 'date:', date);

    const whereClause = { userId: req.user.id };
    if (date) whereClause.date = date;
    if (meal) whereClause.meal = meal;

    const entries = await FoodEntry.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      include: [{
        model: Food,
        attributes: ['id', 'name', 'brand', 'calories', 'protein', 'carbs', 'fat', 'servingSize'],
        required: false // Left join to include entries even if food is not found
      }]
    });

    console.log('Retrieved entries count:', entries.count);
    console.log('Retrieved entries with food data:', JSON.stringify(entries.rows.map(entry => ({
      id: entry.id,
      meal: entry.meal,
      quantity: entry.quantity,
      food: entry.Food ? {
        id: entry.Food.id,
        name: entry.Food.name,
        calories: entry.Food.calories
      } : null
    })), null, 2));

    res.json({
      success: true,
      data: {
        entries: entries.rows,
        total: entries.count,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(entries.count / limit)
      }
    });
  } catch (err) {
    console.error('GET Food Entries Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Besin kayıtları getirilirken bir hata oluştu' 
    });
  }
});

// POST /api/nutrition/entries - Add food entry
router.post('/entries', protect, async (req, res) => {
  try {
    const { foodId, quantity, unit, mealType, meal, date, consumedAt, notes } = req.body;
    
    console.log('POST /entries request body:', req.body);
    
    if (!quantity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Miktar gerekli' 
      });
    }

    // Create or find food if it doesn't exist (for custom entries)
    let food;
    if (foodId) {
      food = await Food.findByPk(foodId);
      if (!food) {
        return res.status(404).json({ 
          success: false, 
          message: 'Yiyecek bulunamadı' 
        });
      }
    } else {
      // Create temporary food entry for calculation
      food = {
        id: Date.now(),
        servingSize: 100,
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      };
    }

    // Determine date from consumedAt or use provided date
    const entryDate = date || (consumedAt ? new Date(consumedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    const entryMeal = mealType || meal || 'breakfast';

    // Calculate nutrition values based on quantity (in grams)
    // Frontend sends quantity in grams, food.calories is per servingSize (usually 100g)
    const servingMultiplier = quantity / (food.servingSize || 100);
    
    const entry = await FoodEntry.create({
      userId: req.user.id,
      foodId: foodId || null,
      quantity,
      unit: unit || 'grams',
      meal: entryMeal,
      date: entryDate,
      notes,
      totalCalories: Math.round(food.calories * servingMultiplier),
      totalProtein: Math.round(food.protein * servingMultiplier * 10) / 10,
      totalCarbs: Math.round(food.carbs * servingMultiplier * 10) / 10,
      totalFat: Math.round(food.fat * servingMultiplier * 10) / 10
    });

    // Include food info in response
    const entryWithFood = await FoodEntry.findByPk(entry.id, {
      include: [{
        model: Food,
        attributes: ['id', 'name', 'brand', 'calories', 'protein', 'carbs', 'fat', 'servingSize']
      }]
    });

    console.log('Created entry with food:', JSON.stringify(entryWithFood, null, 2));

    res.status(201).json({ 
      success: true, 
      data: entryWithFood,
      message: 'Besin kaydı eklendi' 
    });
  } catch (err) {
    console.error('POST Food Entry Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Besin kaydı eklenirken bir hata oluştu' 
    });
  }
});

// PUT /api/nutrition/entries/:id - Update food entry
router.put('/entries/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, unit, meal, notes } = req.body;
    
    const entry = await FoodEntry.findByPk(id, {
      include: [{ model: Food }]
    });
    
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Besin kaydı bulunamadı' 
      });
    }

    // Check permission
    if (req.user.id !== entry.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu kaydı güncelleme yetkiniz yok' 
      });
    }

    // Recalculate nutrition if quantity changed
    let updateData = {
      quantity: quantity !== undefined ? quantity : entry.quantity,
      unit: unit !== undefined ? unit : entry.unit,
      meal: meal !== undefined ? meal : entry.meal,
      notes: notes !== undefined ? notes : entry.notes
    };

    if (quantity !== undefined && quantity !== entry.quantity) {
      // For consistency with POST route, quantity is in grams
      const servingMultiplier = quantity / (entry.Food.servingSize || 100);
      updateData.totalCalories = Math.round(entry.Food.calories * servingMultiplier);
      updateData.totalProtein = Math.round(entry.Food.protein * servingMultiplier * 10) / 10;
      updateData.totalCarbs = Math.round(entry.Food.carbs * servingMultiplier * 10) / 10;
      updateData.totalFat = Math.round(entry.Food.fat * servingMultiplier * 10) / 10;
    }

    await entry.update(updateData);

    res.json({ 
      success: true, 
      data: entry,
      message: 'Besin kaydı güncellendi' 
    });
  } catch (err) {
    console.error('PUT Food Entry Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Besin kaydı güncellenirken bir hata oluştu' 
    });
  }
});

// DELETE /api/nutrition/entries/:id - Delete food entry
router.delete('/entries/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const entry = await FoodEntry.findByPk(id);
    if (!entry) {
      return res.status(404).json({ 
        success: false, 
        message: 'Besin kaydı bulunamadı' 
      });
    }

    // Check permission
    if (req.user.id !== entry.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu kaydı silme yetkiniz yok' 
      });
    }

    await entry.destroy();
    res.json({ 
      success: true, 
      message: 'Besin kaydı silindi' 
    });
  } catch (err) {
    console.error('DELETE Food Entry Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Besin kaydı silinirken bir hata oluştu' 
    });
  }
});

// GET /api/nutrition/summary/:userId - Get daily nutrition summary
router.get('/summary/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { date = new Date().toISOString().split('T')[0] } = req.query;
    
    // Check permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu verilere erişim yetkiniz yok' 
      });
    }

    const entries = await FoodEntry.findAll({
      where: { userId, date },
      include: [{
        model: Food,
        attributes: ['name', 'brand']
      }]
    });

    // Calculate totals by meal
    const summary = {
      breakfast: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      lunch: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      dinner: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      snack: { calories: 0, protein: 0, carbs: 0, fat: 0, entries: [] },
      total: { calories: 0, protein: 0, carbs: 0, fat: 0 }
    };

    entries.forEach(entry => {
      const meal = entry.meal;
      summary[meal].calories += entry.totalCalories || 0;
      summary[meal].protein += entry.totalProtein || 0;
      summary[meal].carbs += entry.totalCarbs || 0;
      summary[meal].fat += entry.totalFat || 0;
      summary[meal].entries.push(entry);

      summary.total.calories += entry.totalCalories || 0;
      summary.total.protein += entry.totalProtein || 0;
      summary.total.carbs += entry.totalCarbs || 0;
      summary.total.fat += entry.totalFat || 0;
    });

    // Round totals
    Object.keys(summary).forEach(key => {
      if (summary[key].calories !== undefined) {
        summary[key].calories = Math.round(summary[key].calories);
        summary[key].protein = Math.round(summary[key].protein * 10) / 10;
        summary[key].carbs = Math.round(summary[key].carbs * 10) / 10;
        summary[key].fat = Math.round(summary[key].fat * 10) / 10;
      }
    });

    res.json({
      success: true,
      data: {
        date,
        summary,
        totalEntries: entries.length
      }
    });
  } catch (err) {
    console.error('GET Nutrition Summary Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Beslenme özeti getirilirken bir hata oluştu' 
    });
  }
});

module.exports = router; 