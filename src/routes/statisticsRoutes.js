const express = require('express');
const StatisticsService = require('../services/statisticsService');
const authMiddleware = require('../middlewares/authMiddleware');


const router = express.Router();

// Middleware - T�m routes authentication gerektirir
router.use(authMiddleware);

// GET /api/statistics/weekly - Haftal�k istatistikler
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
      message: process.env.NODE_ENV === 'production' ? 'Haftal�k istatistikler ba�ar�yla getirildi' : 'Weekly statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Weekly statistics error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Haftal�k istatistikler getirilirken hata olu�tu' : 'Error fetching weekly statistics',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// GET /api/statistics/monthly - Ayl�k istatistikler
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
      message: process.env.NODE_ENV === 'production' ? 'Ayl�k istatistikler ba�ar�yla getirildi' : 'Monthly statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Monthly statistics error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Ayl�k istatistikler getirilirken hata olu�tu' : 'Error fetching monthly statistics',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
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
      message: process.env.NODE_ENV === 'production' ? 'Hedef ilerlemesi ba�ar�yla getirildi' : 'Goal progress retrieved successfully'
    });
  } catch (error) {
    console.error('Goal progress error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Hedef ilerlemesi getirilirken hata olu�tu' : 'Error fetching goal progress',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// GET /api/statistics/dashboard - Dashboard �zet verileri
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
      message: process.env.NODE_ENV === 'production' ? 'Dashboard verileri ba�ar�yla getirildi' : 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === 'production' ? 'Dashboard verileri getirilirken hata olu�tu' : 'Error fetching dashboard data',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

module.exports = router;
