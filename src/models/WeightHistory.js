const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const WeightHistory = sequelize.define('WeightHistory', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  weight: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Weight in kilograms'
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional notes about the weight record'
  }
}, {
  tableName: 'weight_history',
  timestamps: true,
  indexes: [
    {
      fields: ['userId', 'date'],
      unique: true // One weight record per user per day
    }
  ]
});

module.exports = WeightHistory; 