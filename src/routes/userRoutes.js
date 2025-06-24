const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middlewares/authMiddleware');
const validateUser = require('../middlewares/validateUser');
const { upload, handleUploadError, deleteFile, getFileUrl } = require('../middlewares/uploadMiddleware');
const path = require('path');


// Kullanıcı oluştur
router.post('/', validateUser, async (req, res, next) => {
  const { name, email, password } = req.body;
  try {
    // Kullanıcı daha önce kayıtlı mı kontrol et
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Bu e-posta ile kayıtlı bir kullanıcı zaten var' });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kullanıcı oluştur
    const newUser = await User.create({ name, email, password: hashedPassword });

    // JWT Token oluştur
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Kullanıcı güncelle (korumalı route)
router.put('/:id', protect, validateUser, async (req, res, next) => {
  const { id } = req.params;
  const { name, email, password } = req.body;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return next(new Error('Kullanıcı bulunamadı'));
    }

    // Alanları güncelle
    user.name = name || user.name;
    user.email = email || user.email;

    // Eğer şifre güncelleniyorsa, hash'le
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    res.status(200).json({
        success: true,
        data: {
            id: user.id,
            name: user.name,
            email: user.email
        }
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Kullanıcı sil (korumalı route)
router.delete('/:id', protect, async (req, res, next) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return next(new Error('Kullanıcı bulunamadı'));
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email
    };

    await user.destroy();
    res.status(200).json({
        success: true,
        message: 'Kullanıcı başarıyla silindi',
        data: userData
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Tüm kullanıcıları getir
router.get('/', async (req, res, next) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'name', 'email'] });
    res.json({
      success: true,
      data: users
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// Belirli kullanıcıyı getir (korumalı route)
router.get('/:id', protect, async (req, res, next) => {
  const { id } = req.params;

  // İsteği yapan kullanıcı id'si ve istenen id farklı mı, kontrol etmek istersen burada ekleyebilirsin (opsiyonel)

  try {
    const user = await User.findByPk(id, { attributes: ['id', 'name', 'email'] });
    if (!user) {
      return next(new Error('Kullanıcı bulunamadı'));
    }
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});


// Upload profile photo
router.post('/profile-photo', protect, upload.single('profilePhoto'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Profil fotoğrafı yüklenmedi'
      });
    }

    const userId = req.user.id;
    const user = await User.findByPk(userId);
    
    if (!user) {
      // Delete uploaded file if user not found
      deleteFile(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    // Delete old profile photo if exists
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '../../uploads', user.profilePhoto);
      deleteFile(oldPhotoPath);
    }

    // Generate file URL
    const filename = path.relative(path.join(__dirname, '../../uploads'), req.file.path);
    const photoUrl = getFileUrl(req, filename);

    // Update user with new profile photo
    await user.update({ profilePhoto: filename });

    res.json({
      success: true,
      message: 'Profil fotoğrafı başarıyla yüklendi',
      photoUrl: photoUrl,
      filename: filename
    });

  } catch (error) {
    console.error('Profile photo upload error:', error);
    
    // Delete uploaded file on error
    if (req.file) {
      deleteFile(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: 'Profil fotoğrafı yüklenirken bir hata oluştu'
    });
  }
});

// Get profile photo
router.get('/profile-photo', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId, {
      attributes: ['id', 'profilePhoto']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (!user.profilePhoto) {
      return res.json({
        success: true,
        photoUrl: null,
        message: 'Profil fotoğrafı yok'
      });
    }

    const photoUrl = getFileUrl(req, user.profilePhoto);

    res.json({
      success: true,
      photoUrl: photoUrl,
      filename: user.profilePhoto
    });

  } catch (error) {
    console.error('Get profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil fotoğrafı alınırken bir hata oluştu'
    });
  }
});

// Delete profile photo
router.delete('/profile-photo', protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    if (!user.profilePhoto) {
      return res.json({
        success: true,
        message: 'Zaten profil fotoğrafı yok'
      });
    }

    // Delete file from filesystem
    const photoPath = path.join(__dirname, '../../uploads', user.profilePhoto);
    deleteFile(photoPath);

    // Remove from database
    await user.update({ profilePhoto: null });

    res.json({
      success: true,
      message: 'Profil fotoğrafı başarıyla silindi'
    });

  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Profil fotoğrafı silinirken bir hata oluştu'
    });
  }
});

module.exports = router;
