const express = require('express');
const { Goal, User } = require('../models');
const authMiddleware = require('../middlewares/authMiddleware');


const router = express.Router();

// Middleware - Tüm routes authentication gerektirir
router.use(authMiddleware);

// GET /api/goals - Kullanıcının tüm hedeflerini getir
router.get('/', async (req, res) => {
  try {
    const goals = await Goal.findAll({
      where: {
        userId: req.userId
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: goals,
      message: process.env.NODE_ENV === 'production' ? 'Hedefler başarıyla getirildi' : 'Goals retrieved successfully'
    });
  } catch (error) {
    console.error('Goals fetch error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Hedefler getirilirken hata oluştu' : 'Error fetching goals',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// POST /api/goals - Yeni hedef oluştur
router.post('/', async (req, res) => {
  try {
    const {
      dailyCalorieGoal,
      weeklyCalorieGoal,
      dailyWaterGoal,
      currentWeight,
      targetWeight,
      weightGoalType,
      targetDate,
      weeklyWorkoutGoal,
      dailyCalorieBurnGoal,
      notes
    } = req.body;

    // Mevcut aktif hedefleri pasif hale getir (her kullanıcıda tek aktif hedef)
    await Goal.update(
      { isActive: false },
      { 
        where: {
          userId: req.userId,
          isActive: true
        }
      }
    );

    // Yeni hedef oluştur
    const goal = await Goal.create({
      userId: req.userId,
      dailyCalorieGoal,
      weeklyCalorieGoal,
      dailyWaterGoal,
      currentWeight,
      targetWeight,
      weightGoalType,
      targetDate,
      weeklyWorkoutGoal,
      dailyCalorieBurnGoal,
      notes,
      isActive: true
    });

    const createdGoal = await Goal.findByPk(goal.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    res.status(201).json({
      success: true,
      data: createdGoal,
      message: process.env.NODE_ENV === 'production' ? 'Hedef başarıyla oluşturuldu' : 'Goal created successfully'
    });
  } catch (error) {
    console.error('Goal creation error:', error);
    res.status(400).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Hedef oluşturulurken hata oluştu' : 'Error creating goal',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// GET /api/goals/active/current - Kullanıcının aktif hedefini getir
router.get('/active/current', async (req, res) => {
  try {
    const activeGoal = await Goal.findOne({
      where: {
        userId: req.userId,
        isActive: true
      },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    if (!activeGoal) {
      return res.status(404).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Aktif hedef bulunamadı' : 'No active goal found'
      });
    }

    res.json({
      success: true,
      data: activeGoal,
      message: process.env.NODE_ENV === 'production' ? 'Aktif hedef başarıyla getirildi' : 'Active goal retrieved successfully'
    });
  } catch (error) {
    console.error('Active goal fetch error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Aktif hedef getirilirken hata oluştu' : 'Error fetching active goal',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// PUT /api/goals/:id - Hedefi güncelle
router.put('/:id', async (req, res) => {
  try {
    const {
      dailyCalorieGoal,
      weeklyCalorieGoal,
      dailyWaterGoal,
      currentWeight,
      targetWeight,
      weightGoalType,
      targetDate,
      weeklyWorkoutGoal,
      dailyCalorieBurnGoal,
      notes,
      isActive
    } = req.body;

    const goal = await Goal.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Hedef bulunamadı' : 'Goal not found'
      });
    }

    await goal.update({
      dailyCalorieGoal,
      weeklyCalorieGoal,
      dailyWaterGoal,
      currentWeight,
      targetWeight,
      weightGoalType,
      targetDate,
      weeklyWorkoutGoal,
      dailyCalorieBurnGoal,
      notes,
      isActive
    });

    const updatedGoal = await Goal.findByPk(goal.id, {
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    res.json({
      success: true,
      data: updatedGoal,
      message: process.env.NODE_ENV === 'production' ? 'Hedef başarıyla güncellendi' : 'Goal updated successfully'
    });
  } catch (error) {
    console.error('Goal update error:', error);
    res.status(400).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Hedef güncellenirken hata oluştu' : 'Error updating goal',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// DELETE /api/goals/:id - Hedefi sil (soft delete)
router.delete('/:id', async (req, res) => {
  try {
    const goal = await Goal.findOne({
      where: {
        id: req.params.id,
        userId: req.userId
      }
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Hedef bulunamadı' : 'Goal not found'
      });
    }

    await goal.destroy();

    res.json({
      success: true,
      message: process.env.NODE_ENV === 'production' ? 'Hedef başarıyla silindi' : 'Goal deleted successfully'
    });
  } catch (error) {
    console.error('Goal deletion error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Hedef silinirken hata oluştu' : 'Error deleting goal',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

module.exports = router;
