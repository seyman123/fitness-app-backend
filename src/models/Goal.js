const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Goal = sequelize.define('Goal', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  
  // Kalori Hedefleri
  dailyCalorieGoal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 2000,
    validate: {
      min: 800,
      max: 5000
    }
  },
  weeklyCalorieGoal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 5600,
      max: 35000
    }
  },

  // Su Tüketimi Hedefi (L cinsinden)
  dailyWaterGoal: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: true,
    defaultValue: 2.0,
    validate: {
      min: 0.5,
      max: 10.0
    }
  },

  // Uzun Vadeli Kilo Hedefleri
  currentWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 30.0,
      max: 300.0
    }
  },
  targetWeight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    validate: {
      min: 30.0,
      max: 300.0
    }
  },
  weightGoalType: {
    type: DataTypes.ENUM('lose', 'gain', 'maintain'),
    allowNull: true,
    defaultValue: 'maintain'
  },
  targetDate: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Antrenman Hedefleri
  weeklyWorkoutGoal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 3,
    validate: {
      min: 1,
      max: 7
    }
  },
  dailyCalorieBurnGoal: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 300,
    validate: {
      min: 100,
      max: 2000
    }
  },

  // Hedef durumu
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },

  // Notlar
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'goals',
  timestamps: true,
  paranoid: true, // soft delete
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Goal;
