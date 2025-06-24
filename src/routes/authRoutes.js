const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');
const protect = require('../middlewares/authMiddleware');
const config = require('../config/config');

// Kullanıcı kayıt
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  console.log('Kayıt isteği:', { name, email, password });
  try {
    // Kullanıcı zaten var mı kontrol et
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bu e-posta ile kayıtlı bir kullanıcı zaten var' 
      });
    }

    // Validasyon
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tüm alanları doldurunuz'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Şifre en az 6 karakter olmalıdır'
      });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kullanıcı oluştur
    const newUser = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password: hashedPassword
    });

    // JWT token oluştur
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      },
      message: 'Kayıt başarılı'
    });
  } catch (err) {
    console.error('Kayıt hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Kullanıcı giriş
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  console.log('Giriş isteği:', { email, password });
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Geçersiz email veya şifre' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Token doğrulama
router.get('/verify', protect, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'name', 'email', 'createdAt']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Token doğrulama hatası:', err);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
});

// Social login endpoint
router.post('/social', async (req, res) => {
  try {
    const { provider, accessToken, userInfo } = req.body;

    console.log('Social login attempt:', { provider, userInfo: userInfo?.email });

    if (!provider || !accessToken || !userInfo) {
      return res.status(400).json({
        success: false,
        message: 'Provider, access token ve kullanıcı bilgileri gerekli'
      });
    }

    // Validate the access token with the respective provider
    let validatedUserInfo;
    
    try {
      if (provider === 'google') {
        validatedUserInfo = await validateGoogleToken(accessToken, userInfo);
      } else if (provider === 'facebook') {
        validatedUserInfo = await validateFacebookToken(accessToken, userInfo);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Desteklenmeyen provider'
        });
      }
    } catch (validationError) {
      console.error('Token validation failed:', validationError);
      return res.status(401).json({
        success: false,
        message: 'Token doğrulaması başarısız'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ 
      where: { email: validatedUserInfo.email } 
    });

    if (user) {
      // User exists, generate token and login
      const token = jwt.sign(
        { id: user.id, email: user.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        message: `${provider} ile giriş başarılı`,
        isNewUser: false
      });
    } else {
      // Create new user
      const newUser = await User.create({
        name: validatedUserInfo.name,
        email: validatedUserInfo.email,
        password: 'SOCIAL_LOGIN_' + Math.random().toString(36), // Random password for social users
      });

      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
        },
        message: `${provider} ile kayıt başarılı`,
        isNewUser: true
      });
    }

  } catch (err) {
    console.error('Social login error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Sosyal giriş sırasında sunucu hatası' 
    });
  }
});

// Helper function to validate Google token
async function validateGoogleToken(accessToken, userInfo) {
  // In production, you should validate the token with Google's API
  // For now, we'll trust the userInfo if accessToken exists
  
  if (!userInfo.email || !userInfo.name) {
    throw new Error('Google user info is incomplete');
  }

  return {
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture,
    provider: 'google'
  };
}

// Helper function to validate Facebook token
async function validateFacebookToken(accessToken, userInfo) {
  // In production, you should validate the token with Facebook's API
  // For now, we'll trust the userInfo if accessToken exists
  
  if (!userInfo.email || !userInfo.name) {
    throw new Error('Facebook user info is incomplete');
  }

  return {
    email: userInfo.email,
    name: userInfo.name,
    picture: userInfo.picture?.data?.url,
    provider: 'facebook'
  };
}

module.exports = router; 