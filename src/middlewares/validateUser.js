const { body, validationResult } = require('express-validator');

const validateUser = [
  body('name')
    .notEmpty().withMessage('İsim boş olamaz')
    .isLength({ min: 2 }).withMessage('İsim en az 2 karakter olmalı'),

  body('email')
    .notEmpty().withMessage('Email boş olamaz')
    .isEmail().withMessage('Geçerli bir email girin'),

  body('password')
    .if((value, { req }) => req.method === 'POST') // Sadece POST (kayıt) işleminde zorunlu
    .notEmpty().withMessage('Şifre boş olamaz')
    .isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalı'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: errors.array().map(err => err.msg).join(', ')
      });
    }
    next();
  }
];

module.exports = validateUser;
