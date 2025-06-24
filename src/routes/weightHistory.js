const express = require('express');
const router = express.Router();
const { WeightHistory, User } = require('../models');
const protect = require('../middlewares/authMiddleware');
const { Op } = require('sequelize');

// GET /api/weight-history/:userId - Get user's weight history
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, startDate, endDate } = req.query;
    
    // Check permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu verilere erişim yetkiniz yok' 
      });
    }

    // Build where clause
    const whereClause = { userId };
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) whereClause.date[Op.gte] = startDate;
      if (endDate) whereClause.date[Op.lte] = endDate;
    }

    const weightHistory = await WeightHistory.findAndCountAll({
      where: whereClause,
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        records: weightHistory.rows,
        total: weightHistory.count,
        page: Math.floor(offset / limit) + 1,
        totalPages: Math.ceil(weightHistory.count / limit)
      }
    });
  } catch (err) {
    console.error('GET Weight History Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Kilo geçmişi getirilirken bir hata oluştu' 
    });
  }
});

// POST /api/weight-history - Add new weight record
router.post('/', protect, async (req, res) => {
  try {
    const { userId, weight, date, notes } = req.body;
    
    // Check permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu kayıt için yetkiniz yok' 
      });
    }

    // Validate weight
    if (!weight || weight <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli bir kilo değeri giriniz' 
      });
    }

    // Check if record already exists for this date
    const existingRecord = await WeightHistory.findOne({ 
      where: { 
        userId, 
        date: date || new Date().toISOString().split('T')[0] 
      } 
    });

    if (existingRecord) {
      // Update existing record
      await existingRecord.update({ weight, notes });
      res.json({ 
        success: true, 
        data: existingRecord,
        message: 'Kilo kaydı güncellendi' 
      });
    } else {
      // Create new record
      const newRecord = await WeightHistory.create({
        userId,
        weight,
        date: date || new Date().toISOString().split('T')[0],
        notes
      });

      res.status(201).json({ 
        success: true, 
        data: newRecord,
        message: 'Yeni kilo kaydı eklendi' 
      });
    }
  } catch (err) {
    console.error('POST Weight Record Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Kilo kaydı eklenirken bir hata oluştu' 
    });
  }
});

// PUT /api/weight-history/:id - Update weight record
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { weight, notes } = req.body;
    
    const record = await WeightHistory.findByPk(id);
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kilo kaydı bulunamadı' 
      });
    }

    // Check permission
    if (req.user.id !== record.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu kaydı güncelleme yetkiniz yok' 
      });
    }

    // Validate weight
    if (weight && weight <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Geçerli bir kilo değeri giriniz' 
      });
    }

    await record.update({
      weight: weight !== undefined ? weight : record.weight,
      notes: notes !== undefined ? notes : record.notes
    });

    res.json({ 
      success: true, 
      data: record,
      message: 'Kilo kaydı güncellendi' 
    });
  } catch (err) {
    console.error('PUT Weight Record Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Kilo kaydı güncellenirken bir hata oluştu' 
    });
  }
});

// DELETE /api/weight-history/:id - Delete weight record
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    
    const record = await WeightHistory.findByPk(id);
    if (!record) {
      return res.status(404).json({ 
        success: false, 
        message: 'Kilo kaydı bulunamadı' 
      });
    }

    // Check permission
    if (req.user.id !== record.userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu kaydı silme yetkiniz yok' 
      });
    }

    await record.destroy();
    res.json({ 
      success: true, 
      message: 'Kilo kaydı silindi' 
    });
  } catch (err) {
    console.error('DELETE Weight Record Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Kilo kaydı silinirken bir hata oluştu' 
    });
  }
});

// GET /api/weight-history/:userId/stats - Get weight statistics
router.get('/:userId/stats', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    
    // Check permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu verilere erişim yetkiniz yok' 
      });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const records = await WeightHistory.findAll({
      where: {
        userId,
        date: { [Op.gte]: startDate.toISOString().split('T')[0] }
      },
      order: [['date', 'ASC']]
    });

    if (records.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRecords: 0,
          weightChange: 0,
          averageWeight: 0,
          minWeight: 0,
          maxWeight: 0,
          trend: 'stable'
        }
      });
    }

    const weights = records.map(r => r.weight);
    const firstWeight = weights[0];
    const lastWeight = weights[weights.length - 1];
    const weightChange = lastWeight - firstWeight;
    const averageWeight = weights.reduce((sum, w) => sum + w, 0) / weights.length;

    // Calculate trend
    let trend = 'stable';
    if (weightChange > 0.5) trend = 'gaining';
    else if (weightChange < -0.5) trend = 'losing';

    res.json({
      success: true,
      data: {
        totalRecords: records.length,
        weightChange: Math.round(weightChange * 100) / 100,
        averageWeight: Math.round(averageWeight * 100) / 100,
        minWeight: Math.min(...weights),
        maxWeight: Math.max(...weights),
        trend,
        firstWeight,
        lastWeight,
        period: `${days} days`
      }
    });
  } catch (err) {
    console.error('GET Weight Stats Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'İstatistikler getirilirken bir hata oluştu' 
    });
  }
});

module.exports = router; 