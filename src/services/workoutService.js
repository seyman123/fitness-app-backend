const { Workout, WorkoutSession, User } = require('../models');
const { Op } = require('sequelize');

class WorkoutService {
  constructor() {
    this.defaultWorkouts = [
      {
        name: 'Temel Güç Antrenmanı',
        description: 'Yeni başlayanlar için temel güç egzersizleri',
        category: 'strength',
        difficulty: 'beginner',
        duration: 45,
        exercises: [
          { name: 'Push-up', sets: 3, reps: 10, rest: 60 },
          { name: 'Squat', sets: 3, reps: 15, rest: 60 },
          { name: 'Plank', sets: 3, duration: 30, rest: 60 },
          { name: 'Lunges', sets: 3, reps: 12, rest: 60 }
        ],
        isTemplate: true,
        estimatedCalories: 200
      },
      {
        name: 'Kardiyo HIIT',
        description: 'Yüksek yoğunluklu aralık antrenmanı',
        category: 'cardio',
        difficulty: 'intermediate',
        duration: 30,
        exercises: [
          { name: 'Jumping Jacks', sets: 4, duration: 45, rest: 15 },
          { name: 'Burpees', sets: 4, reps: 8, rest: 15 },
          { name: 'Mountain Climbers', sets: 4, duration: 30, rest: 15 },
          { name: 'High Knees', sets: 4, duration: 30, rest: 15 }
        ],
        isTemplate: true,
        estimatedCalories: 300
      },
      {
        name: 'Esneklik ve Yoga',
        description: 'Günlük esneklik ve rahatlama egzersizleri',
        category: 'flexibility',
        difficulty: 'beginner',
        duration: 25,
        exercises: [
          { name: 'Cat-Cow Stretch', sets: 1, reps: 10, rest: 30 },
          { name: 'Downward Dog', sets: 1, duration: 60, rest: 30 },
          { name: 'Child\'s Pose', sets: 1, duration: 90, rest: 30 },
          { name: 'Seated Forward Bend', sets: 1, duration: 60, rest: 30 }
        ],
        isTemplate: true,
        estimatedCalories: 100
      },
      {
        name: 'Üst Vücut Güç',
        description: 'Üst vücut kas grupları için yoğun antrenman',
        category: 'strength',
        difficulty: 'advanced',
        duration: 60,
        exercises: [
          { name: 'Pull-ups', sets: 4, reps: 8, rest: 90 },
          { name: 'Push-ups', sets: 4, reps: 15, rest: 60 },
          { name: 'Dips', sets: 3, reps: 12, rest: 90 },
          { name: 'Pike Push-ups', sets: 3, reps: 10, rest: 60 }
        ],
        isTemplate: true,
        estimatedCalories: 250
      },
      {
        name: 'Alt Vücut Güç',
        description: 'Bacak ve kalça kasları için güç antrenmanı',
        category: 'strength',
        difficulty: 'intermediate',
        duration: 50,
        exercises: [
          { name: 'Squats', sets: 4, reps: 20, rest: 90 },
          { name: 'Lunges', sets: 3, reps: 15, rest: 60 },
          { name: 'Calf Raises', sets: 3, reps: 25, rest: 45 },
          { name: 'Glute Bridges', sets: 3, reps: 20, rest: 60 }
        ],
        isTemplate: true,
        estimatedCalories: 220
      }
    ];
  }

  /**
   * Initialize default workout templates
   */
  async initializeDefaultWorkouts() {
    try {
      console.log('Initializing default workout templates...');
      
      for (const workoutData of this.defaultWorkouts) {
        // Check if workout already exists
        const existing = await Workout.findOne({
          where: { name: workoutData.name, isTemplate: true }
        });

        if (!existing) {
          await Workout.create({
            ...workoutData,
            createdBy: null // System created
          });
          console.log(`Created workout template: ${workoutData.name}`);
        }
      }
      
      console.log('Default workout templates initialized successfully');
    } catch (error) {
      console.error('Error initializing default workouts:', error);
    }
  }

  /**
   * Get workout templates with filtering and pagination
   */
  async getWorkoutTemplates(filters = {}) {
    const {
      category,
      difficulty,
      maxDuration,
      search,
      limit = 20,
      offset = 0
    } = filters;

    const whereClause = { isTemplate: true };

    if (category) whereClause.category = category;
    if (difficulty) whereClause.difficulty = difficulty;
    if (maxDuration) whereClause.duration = { [Op.lte]: maxDuration };
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }

    const result = await Workout.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['difficulty', 'ASC'], ['duration', 'ASC']],
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    return {
      workouts: result.rows,
      total: result.count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(result.count / limit)
    };
  }

  /**
   * Get workout by ID
   */
  async getWorkoutById(workoutId) {
    return await Workout.findByPk(workoutId, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
        required: false
      }]
    });
  }

  /**
   * Create workout from template for user
   */
  async createWorkoutFromTemplate(templateId, userId, customizations = {}) {
    try {
      const template = await this.getWorkoutById(templateId);
      if (!template) {
        throw new Error('Workout template not found');
      }

      // Create workout session from template
      const sessionData = {
        userId,
        workoutId: templateId,
        name: customizations.name || template.name,
        exercises: customizations.exercises || template.exercises,
        status: 'planned',
        plannedDuration: customizations.duration || template.duration,
        estimatedCalories: template.estimatedCalories,
        notes: customizations.notes || null
      };

      const session = await WorkoutSession.create(sessionData);
      return session;
    } catch (error) {
      console.error('Error creating workout from template:', error);
      throw error;
    }
  }

  /**
   * Start workout session
   */
  async startWorkoutSession(sessionId, userId) {
    try {
      const session = await WorkoutSession.findOne({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new Error('Workout session not found');
      }

      if (session.status !== 'planned') {
        throw new Error('Workout session already started or completed');
      }

      await session.update({
        status: 'in_progress',
        startTime: new Date()
      });

      return session;
    } catch (error) {
      console.error('Error starting workout session:', error);
      throw error;
    }
  }

  /**
   * Complete workout session
   */
  async completeWorkoutSession(sessionId, userId, completionData = {}) {
    try {
      const session = await WorkoutSession.findOne({
        where: { id: sessionId, userId }
      });

      if (!session) {
        throw new Error('Workout session not found');
      }

      const endTime = new Date();
      const actualDuration = completionData.duration || 
        (session.startTime ? Math.round((endTime - new Date(session.startTime)) / 60000) : null);

      await session.update({
        status: 'completed',
        endTime,
        duration: actualDuration,
        caloriesBurned: completionData.caloriesBurned || session.estimatedCalories,
        notes: completionData.notes || session.notes,
        completedExercises: completionData.completedExercises || session.exercises
      });

      return session;
    } catch (error) {
      console.error('Error completing workout session:', error);
      throw error;
    }
  }

  /**
   * Get user workout statistics
   */
  async getUserWorkoutStats(userId, timeRange = 'month') {
    try {
      const startDate = new Date();
      
      switch (timeRange) {
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const sessions = await WorkoutSession.findAll({
        where: {
          userId,
          status: 'completed',
          endTime: { [Op.gte]: startDate }
        }
      });

      const stats = {
        totalWorkouts: sessions.length,
        totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
        totalCalories: sessions.reduce((sum, s) => sum + (s.caloriesBurned || 0), 0),
        averageDuration: sessions.length > 0 ? 
          Math.round(sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length) : 0,
        workoutsByCategory: {},
        timeRange
      };

      // Group by category
      sessions.forEach(session => {
        const category = session.category || 'other';
        stats.workoutsByCategory[category] = (stats.workoutsByCategory[category] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting user workout stats:', error);
      throw error;
    }
  }

  /**
   * Get popular workout templates
   */
  async getPopularWorkouts(limit = 10) {
    try {
      // Get templates with most sessions
      const popularWorkouts = await Workout.findAll({
        where: { isTemplate: true },
        include: [{
          model: WorkoutSession,
          attributes: [],
          required: false
        }],
        attributes: [
          'id', 'name', 'description', 'category', 'difficulty', 
          'duration', 'estimatedCalories', 'exercises'
        ],
        group: ['Workout.id'],
        order: [[WorkoutSession, 'id', 'DESC']],
        limit: parseInt(limit)
      });

      return popularWorkouts;
    } catch (error) {
      console.error('Error getting popular workouts:', error);
      return [];
    }
  }
}

module.exports = new WorkoutService(); 