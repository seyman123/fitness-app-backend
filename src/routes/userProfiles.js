const express = require('express');
const router = express.Router();
const { UserProfile, User } = require('../models');
const protect = require('../middlewares/authMiddleware');

// Calculate daily calories based on profile data
const calculateDailyCalories = ({ age, gender, height, weight, activityLevel, fitnessGoal }) => {
  if (!age || !gender || !height || !weight || !activityLevel) return 2000;

  let bmr = 0;
  if (gender === 'male') {
    bmr = 88.362 + (13.397 * parseFloat(weight)) + (4.799 * parseFloat(height)) - (5.677 * parseInt(age));
  } else {
    bmr = 447.593 + (9.247 * parseFloat(weight)) + (3.098 * parseFloat(height)) - (4.330 * parseInt(age));
  }
  
  // Activity multiplier
  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  
  let calories = bmr * activityMultipliers[activityLevel];
  
  // Adjust based on goal
  switch (fitnessGoal) {
    case 'weight_loss':
      calories -= 500; // Deficit for weight loss
      break;
    case 'muscle_gain':
      calories += 300; // Surplus for muscle gain
      break;
    default:
      // No adjustment
      break;
  }
  
  return Math.round(calories);
};

// GET /api/user-profiles/:userId - Get user profile
router.get('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log('=== GET PROFILE DEBUG ===');
    console.log('req.params.userId:', userId);
    console.log('req.user.id:', req.user.id);
    console.log('parseInt(userId):', parseInt(userId));
    console.log('Permission check:', req.user.id !== parseInt(userId));
    
    // Check if requesting user has permission (can only access own profile or admin)
    if (req.user.id !== parseInt(userId)) {
      console.log('Permission denied!');
      return res.status(403).json({ 
        success: false, 
        message: 'Bu profili görüntüleme yetkiniz yok' 
      });
    }

    console.log('Searching for profile with userId:', userId);
    const profile = await UserProfile.findOne({ 
      where: { userId: parseInt(userId) },
      include: [{
        model: User,
        attributes: ['id', 'name', 'email']
      }]
    });

    console.log('Found profile:', profile ? {
      id: profile.id,
      userId: profile.userId,
      age: profile.age
    } : 'null');

    if (!profile) {
      console.log('No profile found for userId:', userId);
      return res.status(404).json({ 
        success: false, 
        message: 'Profil bulunamadı' 
      });
    }

    console.log('Returning profile for userId:', profile.userId);
    res.json({ 
      success: true, 
      data: profile 
    });
  } catch (err) {
    console.error('GET Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Profil getirilirken bir hata oluştu' 
    });
  }
});

// POST /api/user-profiles - Create new user profile
router.post('/', protect, async (req, res) => {
  try {
    const { 
      userId, 
      age, 
      gender, 
      height, 
      weight, 
      fitnessGoal, 
      activityLevel, 
      dailyWaterTarget,
      dailyCalorieTarget 
    } = req.body;

    console.log('POST Profile Request:');
    console.log('req.user:', req.user);
    console.log('req.body.userId:', userId);
    console.log('req.user.id:', req.user.id);
    console.log('parseInt(userId):', parseInt(userId));
    console.log('Comparison result:', req.user.id !== parseInt(userId));

    // Check if requesting user has permission
    if (req.user.id !== parseInt(userId)) {
      console.log('Permission denied: User ID mismatch');
      return res.status(403).json({ 
        success: false, 
        message: 'Bu profili oluşturma yetkiniz yok' 
      });
    }

    // Check if profile already exists
    const existingProfile = await UserProfile.findOne({ where: { userId } });
    if (existingProfile) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu kullanıcı için profil zaten mevcut' 
      });
    }

    // Calculate daily calorie target if not provided
    let calculatedCalorieTarget = dailyCalorieTarget;
    if (!dailyCalorieTarget && age && gender && height && weight && activityLevel) {
      calculatedCalorieTarget = calculateDailyCalories({
        age, gender, height, weight, activityLevel, fitnessGoal
      });
    }

    const newProfile = await UserProfile.create({
      userId,
      age,
      gender,
      height,
      weight,
      fitnessGoal,
      activityLevel,
      dailyWaterTarget: dailyWaterTarget || 2500,
      dailyCalorieTarget: calculatedCalorieTarget
    });

    res.status(201).json({ 
      success: true, 
      data: newProfile 
    });
  } catch (err) {
    console.error('POST Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Profil oluşturulamadı' 
    });
  }
});

// PUT /api/user-profiles/:userId - Update user profile
router.put('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      age, 
      gender, 
      height, 
      weight, 
      fitnessGoal, 
      activityLevel, 
      dailyWaterTarget,
      dailyCalorieTarget 
    } = req.body;

    // Check if requesting user has permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu profili güncelleme yetkiniz yok' 
      });
    }

    let profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      // Create new profile if doesn't exist (upsert behavior)
      let calculatedCalorieTarget = dailyCalorieTarget;
      if (!dailyCalorieTarget && age && gender && height && weight && activityLevel) {
        calculatedCalorieTarget = calculateDailyCalories({
          age, gender, height, weight, activityLevel, fitnessGoal
        });
      }

      profile = await UserProfile.create({ 
        userId, 
        age, 
        gender, 
        height, 
        weight, 
        fitnessGoal, 
        activityLevel, 
        dailyWaterTarget: dailyWaterTarget || 2500,
        dailyCalorieTarget: calculatedCalorieTarget
      });
    } else {
      // Update existing profile
      let calculatedCalorieTarget = dailyCalorieTarget;
      if (!dailyCalorieTarget && age && gender && height && weight && activityLevel) {
        calculatedCalorieTarget = calculateDailyCalories({
          age, gender, height, weight, activityLevel, fitnessGoal
        });
      }

      await profile.update({
        age: age !== undefined ? age : profile.age,
        gender: gender !== undefined ? gender : profile.gender,
        height: height !== undefined ? height : profile.height,
        weight: weight !== undefined ? weight : profile.weight,
        fitnessGoal: fitnessGoal !== undefined ? fitnessGoal : profile.fitnessGoal,
        activityLevel: activityLevel !== undefined ? activityLevel : profile.activityLevel,
        dailyWaterTarget: dailyWaterTarget !== undefined ? dailyWaterTarget : profile.dailyWaterTarget,
        dailyCalorieTarget: calculatedCalorieTarget !== undefined ? calculatedCalorieTarget : profile.dailyCalorieTarget
      });
    }

    res.json({ 
      success: true, 
      data: profile 
    });
  } catch (err) {
    console.error('PUT Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Profil güncellenirken bir hata oluştu' 
    });
  }
});

// DELETE /api/user-profiles/:userId - Delete user profile
router.delete('/:userId', protect, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if requesting user has permission
    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Bu profili silme yetkiniz yok' 
      });
    }

    const profile = await UserProfile.findOne({ where: { userId } });
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        message: 'Profil bulunamadı' 
      });
    }

    await profile.destroy();
    res.json({ 
      success: true, 
      message: 'Profil başarıyla silindi' 
    });
  } catch (err) {
    console.error('DELETE Profile Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Profil silinirken bir hata oluştu' 
    });
  }
});

module.exports = router; 