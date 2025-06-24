const express = require('express');
const router = express.Router();
const UserProfile = require('../models/UserProfile');
const protect = require('../middlewares/authMiddleware');

// Profil bilgisi ekle veya güncelle
router.post('/', async (req, res) => {
  try {
    const { userId, age, gender, height, weight, fitnessGoal, activityLevel, dailyCalorieTarget, dailyWaterTarget } = req.body;

    const newProfile = await UserProfile.create({
      userId,
      age,
      gender,
      height,
      weight,
      fitnessGoal,
      activityLevel,
      dailyCalorieTarget,
      dailyWaterTarget,
    });

    res.status(201).json({ success: true, data: newProfile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Profil oluşturulamadı' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { age, gender, height, weight, fitnessGoal, activityLevel, dailyCalorieTarget, dailyWaterTarget } = req.body;

  try {
    let profile = await UserProfile.findOne({ where: { userId: id } });

    if (!profile) {
      profile = await UserProfile.create({ userId: id, age, gender, height, weight, fitnessGoal, activityLevel, dailyCalorieTarget, dailyWaterTarget });
    } else {
      profile.age = age;
      profile.gender = gender;
      profile.height = height;
      profile.weight = weight;
      profile.fitnessGoal = fitnessGoal;
      profile.activityLevel = activityLevel;
      profile.dailyCalorieTarget = dailyCalorieTarget;
      profile.dailyWaterTarget = dailyWaterTarget;
      await profile.save();
    }

    res.json({ success: true, data: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Profil güncellenirken bir hata oluştu' });
  }
});

module.exports = router;
