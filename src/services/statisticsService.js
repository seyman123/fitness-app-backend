const { WorkoutSession, FoodEntry, User, Goal } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

class StatisticsService {
  
  // Haftalık veri analizi
  static async getWeeklyStats(userId, startDate = null, endDate = null) {
    try {
      const start = startDate ? moment(startDate) : moment().startOf('week');
      const end = endDate ? moment(endDate) : moment().endOf('week');
      
      // Haftalık antrenman verileri
      const workoutStats = await WorkoutSession.findAll({
        where: {
          userId,
          createdAt: {
            [Op.between]: [start.toDate(), end.toDate()]
          }
        },
        attributes: ['createdAt', 'duration', 'caloriesBurned'],
        order: [['createdAt', 'ASC']]
      });

      // Haftalık beslenme verileri
      const nutritionStats = await FoodEntry.findAll({
        where: {
          userId,
          createdAt: {
            [Op.between]: [start.toDate(), end.toDate()]
          }
        },
        attributes: ['createdAt', 'quantity', 'totalCalories'],
        order: [['createdAt', 'ASC']]
      });

      // Günlük toplam değerler
      const dailyData = [];
      for (let i = 0; i < 7; i++) {
        const currentDay = start.clone().add(i, 'days');
        const dayStart = currentDay.startOf('day').toDate();
        const dayEnd = currentDay.endOf('day').toDate();

        // Günlük antrenman
        const dayWorkouts = workoutStats.filter(w => 
          moment(w.createdAt).isBetween(dayStart, dayEnd, null, '[]')
        );
        
        // Günlük beslenme
        const dayNutrition = nutritionStats.filter(n => 
          moment(n.createdAt).isBetween(dayStart, dayEnd, null, '[]')
        );

        dailyData.push({
          date: currentDay.format('YYYY-MM-DD'),
          dayName: currentDay.format('dddd'),
          workout: {
            totalDuration: dayWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
            totalCaloriesBurned: dayWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
            sessionCount: dayWorkouts.length
          },
          nutrition: {
            totalCalories: dayNutrition.reduce((sum, n) => sum + (n.totalCalories || 0), 0),
            entryCount: dayNutrition.length
          }
        });
      }

      return {
        startDate: start.format('YYYY-MM-DD'),
        endDate: end.format('YYYY-MM-DD'),
        totalWorkouts: workoutStats.length,
        totalWorkoutDuration: workoutStats.reduce((sum, w) => sum + (w.duration || 0), 0),
        totalCaloriesBurned: workoutStats.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
        totalCaloriesConsumed: nutritionStats.reduce((sum, n) => sum + (n.totalCalories || 0), 0),
        dailyData
      };
    } catch (error) {
      console.error('Weekly stats error:', error);
      throw error;
    }
  }

  // Aylık veri analizi  
  static async getMonthlyStats(userId, month = null, year = null) {
    try {
      const targetMonth = month || moment().month() + 1;
      const targetYear = year || moment().year();
      
      const start = moment({ year: targetYear, month: targetMonth - 1 }).startOf('month');
      const end = moment({ year: targetYear, month: targetMonth - 1 }).endOf('month');

      // Aylık antrenman verileri
      const workoutStats = await WorkoutSession.findAll({
        where: {
          userId,
          createdAt: {
            [Op.between]: [start.toDate(), end.toDate()]
          }
        },
        attributes: ['createdAt', 'duration', 'caloriesBurned'],
        order: [['createdAt', 'ASC']]
      });

      // Aylık beslenme verileri
      const nutritionStats = await FoodEntry.findAll({
        where: {
          userId,
          createdAt: {
            [Op.between]: [start.toDate(), end.toDate()]
          }
        },
        attributes: ['createdAt', 'quantity', 'totalCalories'],
        order: [['createdAt', 'ASC']]
      });

      // Haftalık gruplandırma
      const weeklyData = [];
      let currentWeekStart = start.clone();
      
      while (currentWeekStart.isBefore(end)) {
        const weekEnd = currentWeekStart.clone().endOf('week');
        const actualWeekEnd = weekEnd.isAfter(end) ? end : weekEnd;
        
        const weekWorkouts = workoutStats.filter(w => 
          moment(w.createdAt).isBetween(currentWeekStart, actualWeekEnd, null, '[]')
        );
        
        const weekNutrition = nutritionStats.filter(n => 
          moment(n.createdAt).isBetween(currentWeekStart, actualWeekEnd, null, '[]')
        );

        weeklyData.push({
          weekStart: currentWeekStart.format('YYYY-MM-DD'),
          weekEnd: actualWeekEnd.format('YYYY-MM-DD'),
          workout: {
            totalDuration: weekWorkouts.reduce((sum, w) => sum + (w.duration || 0), 0),
            totalCaloriesBurned: weekWorkouts.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
            sessionCount: weekWorkouts.length
          },
          nutrition: {
            totalCalories: weekNutrition.reduce((sum, n) => sum + (n.totalCalories || 0), 0),
            entryCount: weekNutrition.length
          }
        });
        
        currentWeekStart.add(1, 'week').startOf('week');
      }

      return {
        month: targetMonth,
        year: targetYear,
        monthName: start.format('MMMM'),
        totalWorkouts: workoutStats.length,
        totalWorkoutDuration: workoutStats.reduce((sum, w) => sum + (w.duration || 0), 0),
        totalCaloriesBurned: workoutStats.reduce((sum, w) => sum + (w.caloriesBurned || 0), 0),
        totalCaloriesConsumed: nutritionStats.reduce((sum, n) => sum + (n.totalCalories || 0), 0),
        weeklyData
      };
    } catch (error) {
      console.error('Monthly stats error:', error);
      throw error;
    }
  }

  // Hedef karşılaştırması
  static async getGoalProgress(userId) {
    try {
      const activeGoal = await Goal.findOne({
        where: { userId, isActive: true },
        order: [['createdAt', 'DESC']]
      });

      if (!activeGoal) {
        return { hasActiveGoal: false };
      }

      // Bu haftaki veriler
      const thisWeekStats = await this.getWeeklyStats(userId);
      
      // Bu ayki veriler
      const thisMonthStats = await this.getMonthlyStats(userId);

      // Hedef karşılaştırması
      const progress = {
        hasActiveGoal: true,
        goal: activeGoal,
        weekly: {
          current: thisWeekStats,
          progress: {
            workouts: {
              target: activeGoal.weeklyWorkoutGoal || 0,
              achieved: thisWeekStats.totalWorkouts,
              percentage: activeGoal.weeklyWorkoutGoal ? 
                Math.round((thisWeekStats.totalWorkouts / activeGoal.weeklyWorkoutGoal) * 100) : 0
            },
            caloriesBurned: {
              target: (activeGoal.dailyCalorieBurnGoal || 0) * 7,
              achieved: thisWeekStats.totalCaloriesBurned,
              percentage: activeGoal.dailyCalorieBurnGoal ? 
                Math.round((thisWeekStats.totalCaloriesBurned / (activeGoal.dailyCalorieBurnGoal * 7)) * 100) : 0
            }
          }
        },
        monthly: {
          current: thisMonthStats,
          progress: {
            workouts: {
              target: (activeGoal.weeklyWorkoutGoal || 0) * 4,
              achieved: thisMonthStats.totalWorkouts,
              percentage: activeGoal.weeklyWorkoutGoal ? 
                Math.round((thisMonthStats.totalWorkouts / (activeGoal.weeklyWorkoutGoal * 4)) * 100) : 0
            }
          }
        }
      };

      return progress;
    } catch (error) {
      console.error('Goal progress error:', error);
      throw error;
    }
  }
}

module.exports = StatisticsService;
