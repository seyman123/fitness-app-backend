const express = require('express');
const StatisticsService = require('../services/statisticsService');
const authMiddleware = require('../middlewares/authMiddleware');
const config = require('../config/config');

const router = express.Router();

// Middleware - Tüm routes authentication gerektirir
router.use(authMiddleware);

// GET /api/statistics/weekly - Haftalık istatistikler
router.get('/weekly', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const weeklyStats = await StatisticsService.getWeeklyStats(
      req.userId, 
      startDate, 
      endDate
    );

    res.json({
      success: true,
      data: weeklyStats,
      message: config.NODE_ENV === 'production' ? 'Haftalık istatistikler başarıyla getirildi' : 'Weekly statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Weekly statistics error:', error);
    res.status(500).json({
      success: false,
      message: config.NODE_ENV === 'production' ? 'Haftalık istatistikler getirilirken hata oluştu' : 'Error fetching weekly statistics',
      ...(config.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// GET /api/statistics/monthly - Aylık istatistikler
router.get('/monthly', async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const monthlyStats = await StatisticsService.getMonthlyStats(
      req.userId,
      month ? parseInt(month) : null,
      year ? parseInt(year) : null
    );

    res.json({
      success: true,
      data: monthlyStats,
      message: config.NODE_ENV === 'production' ? 'Aylık istatistikler başarıyla getirildi' : 'Monthly statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Monthly statistics error:', error);
    res.status(500).json({
      success: false,
      message: config.NODE_ENV === 'production' ? 'Aylık istatistikler getirilirken hata oluştu' : 'Error fetching monthly statistics',
      ...(config.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// GET /api/statistics/progress - Hedef ilerleme durumu
router.get('/progress', async (req, res) => {
  try {
    const progress = await StatisticsService.getGoalProgress(req.userId);

    res.json({
      success: true,
      data: progress,
      message: config.NODE_ENV === 'production' ? 'Hedef ilerlemesi başarıyla getirildi' : 'Goal progress retrieved successfully'
    });
  } catch (error) {
    console.error('Goal progress error:', error);
    res.status(500).json({
      success: false,
      message: config.NODE_ENV === 'production' ? 'Hedef ilerlemesi getirilirken hata oluştu' : 'Error fetching goal progress',
      ...(config.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// GET /api/statistics/dashboard - Dashboard özet verileri
router.get('/dashboard', async (req, res) => {
  try {
    const [weeklyStats, monthlyStats, goalProgress] = await Promise.all([
      StatisticsService.getWeeklyStats(req.userId),
      StatisticsService.getMonthlyStats(req.userId),
      StatisticsService.getGoalProgress(req.userId)
    ]);

    const dashboardData = {
      thisWeek: weeklyStats,
      thisMonth: monthlyStats,
      goalProgress: goalProgress,
      summary: {
        weeklyWorkouts: weeklyStats.totalWorkouts,
        weeklyCaloriesBurned: weeklyStats.totalCaloriesBurned,
        weeklyCaloriesConsumed: weeklyStats.totalCaloriesConsumed,
        monthlyWorkouts: monthlyStats.totalWorkouts,
        monthlyCaloriesBurned: monthlyStats.totalCaloriesBurned,
        monthlyCaloriesConsumed: monthlyStats.totalCaloriesConsumed
      }
    };

    res.json({
      success: true,
      data: dashboardData,
      message: config.NODE_ENV === 'production' ? 'Dashboard verileri başarıyla getirildi' : 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: config.NODE_ENV === 'production' ? 'Dashboard verileri getirilirken hata oluştu' : 'Error fetching dashboard data',
      ...(config.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

module.exports = router;
