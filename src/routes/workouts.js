const express = require('express');
const router = express.Router();
const { Workout, WorkoutSession, User } = require('../models');
const protect = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');
const workoutService = require('../services/workoutService');

// GET /api/workouts - Get workout templates with enhanced filtering
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, maxDuration, search, limit = 20, offset = 0 } = req.query;
    
    const filters = {
      category,
      difficulty,
      maxDuration: maxDuration ? parseInt(maxDuration) : undefined,
      search,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const result = await workoutService.getWorkoutTemplates(filters);

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error('GET Workouts Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Antrenmanlar getirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/workouts/popular - Get popular workout templates
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const workouts = await workoutService.getPopularWorkouts(parseInt(limit));

    res.json({
      success: true,
      data: {
        workouts: workouts,
        total: workouts.length
      }
    });
  } catch (err) {
    console.error('GET Popular Workouts Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Popüler antrenmanlar getirilirken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// POST /api/workouts/from-template - Create workout session from template
router.post('/from-template', protect, async (req, res) => {
  try {
    const { templateId, customizations } = req.body;
    
    if (!templateId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Template ID gerekli' 
      });
    }

    const session = await workoutService.createWorkoutFromTemplate(
      templateId, 
      req.user.id, 
      customizations
    );
    
    res.status(201).json({
      success: true,
      data: session,
      message: 'Antrenman planlandı'
    });
  } catch (err) {
    console.error('Create Workout From Template Error:', err);
    res.status(500).json({ 
      success: false, 
      message: err.message || 'Antrenman planlanırken bir hata oluştu',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// GET /api/workouts/:id - Get specific workout
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const workout = await Workout.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'name'],
        required: false
      }]
    });

    if (!workout) {
      return res.status(404).json({ 
        success: false, 
        message: 'Antrenman bulunamadı' 
      });
    }

    res.json({ 
      success: true, 
      data: workout 
    });
  } catch (err) {
    console.error('GET Workout Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Antrenman getirilirken bir hata oluştu' 
    });
  }
});

// POST /api/workouts - Create workout template (protected)
router.post('/', protect, async (req, res) => {
  try {
    const { 
      name, 
      description, 
      category, 
      difficulty, 
      duration, 
      exercises,
      isTemplate = true 
    } = req.body;

    if (!name || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Antrenman adı ve kategorisi gerekli' 
      });
    }

    const workout = await Workout.create({
      name,
      description,
      category,
      difficulty,
      duration,
      exercises,
      isTemplate,
      createdBy: req.user.id
    });

    res.status(201).json({ 
      success: true, 
      data: workout,
      message: 'Antrenman şablonu oluşturuldu' 
    });
  } catch (err) {
    console.error('POST Workout Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Antrenman oluşturulurken bir hata oluştu' 
    });
  }
});

// GET /api/workouts/sessions/:userId - Get user's workout sessions
router.get('/sessions/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, status } = req.query;
    
    // Check permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu verilere erişim yetkiniz yok' 
      });
    }

    const whereClause = { userId };
    if (status) whereClause.status = status;

    const sessions = await WorkoutSession.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['startTime', 'DESC']],
      include: [{
        model: Workout,
        attributes: ['id', 'name', 'category', 'difficulty'],
        required: false
      }]
    });

    res.json({
      success: true,
      data: {
        sessions: sessions.rows,
        total: sessions.count,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(sessions.count / limit)
      }
    });
  } catch (err) {
    console.error('GET Workout Sessions Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Antrenman geçmişi getirilirken bir hata oluştu' 
    });
  }
});

// POST /api/workouts/sessions - Start new workout session
router.post('/sessions', protect, async (req, res) => {
  try {
    const { workoutId, name, exercises, duration, caloriesBurned, notes, type, startTime, endTime, status } = req.body;
    
    console.log('Creating workout session with data:', {
      userId: req.user.id,
      workoutId,
      name,
      duration,
      caloriesBurned,
      type,
      status: status || 'in_progress'
    });
    
    if (!name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Antrenman adı gerekli' 
      });
    }

    const sessionData = {
      userId: req.user.id,
      workoutId: workoutId || null,
      name,
      exercises,
      status: status || 'in_progress'
    };

    // Add optional fields if provided
    if (duration !== undefined) sessionData.duration = duration;
    if (caloriesBurned !== undefined) sessionData.caloriesBurned = caloriesBurned;
    if (notes !== undefined) sessionData.notes = notes;
    if (startTime) sessionData.startTime = startTime;
    if (endTime) sessionData.endTime = endTime;

    const session = await WorkoutSession.create(sessionData);

    console.log('Created workout session:', session.toJSON());

    res.status(201).json({ 
      success: true, 
      data: session,
      message: 'Antrenman başlatıldı' 
    });
  } catch (err) {
    console.error('POST Workout Session Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Antrenman başlatılırken bir hata oluştu' 
    });
  }
});

// PUT /api/workouts/sessions/:id - Update workout session
router.put('/sessions/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { exercises, notes, caloriesBurned, status, endTime } = req.body;
    
    const session = await WorkoutSession.findByPk(id);
    if (!session) {
      return res.status(404).json({ 
        success: false, 
        message: 'Antrenman seansı bulunamadı' 
      });
    }

    // Check permission
    if (req.user.id !== session.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu antrenmanı güncelleme yetkiniz yok' 
      });
    }

    // Calculate duration if ending
    let duration = session.duration;
    if (status === 'completed' && !session.endTime) {
      const end = endTime ? new Date(endTime) : new Date();
      duration = Math.round((end - new Date(session.startTime)) / (1000 * 60)); // minutes
    }

    await session.update({
      exercises: exercises !== undefined ? exercises : session.exercises,
      notes: notes !== undefined ? notes : session.notes,
      caloriesBurned: caloriesBurned !== undefined ? caloriesBurned : session.caloriesBurned,
      status: status !== undefined ? status : session.status,
      endTime: endTime !== undefined ? endTime : session.endTime,
      duration
    });

    res.json({ 
      success: true, 
      data: session,
      message: status === 'completed' ? 'Antrenman tamamlandı' : 'Antrenman güncellendi' 
    });
  } catch (err) {
    console.error('PUT Workout Session Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Antrenman güncellenirken bir hata oluştu' 
    });
  }
});

module.exports = router; 