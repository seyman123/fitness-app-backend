require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/db');

// Environment validation
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET environment variable is missing!');
  console.error('Please add JWT_SECRET to your .env file');
  process.exit(1);
}

// Import all models to ensure relationships are defined
require('./models');

// Import services
const workoutService = require('./services/workoutService');
const FoodSeeder = require('./seeders/foodSeeder');

const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profile');
const userProfileRoutes = require('./routes/userProfiles');
const weightHistoryRoutes = require('./routes/weightHistory');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const goalRoutes = require('./routes/goalRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const errorHandler = require('./middlewares/errorMiddleware');

const app = express();

// CORS configuration based on environment
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: process.env.JSON_LIMIT || '10mb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.JSON_LIMIT || '10mb' }));

// Serve static files (uploaded images)
app.use('/uploads', express.static('uploads'));

// Health check endpoint for deployment
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Fitness App Backend is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes); // Keep for backward compatibility
app.use('/api/user-profiles', userProfileRoutes); // New endpoint for frontend
app.use('/api/weight-history', weightHistoryRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use(errorHandler);

// Test Sequelize connection and sync tables
sequelize.authenticate()
  .then(() => {
    console.log('✅ Database connection successful');
    return sequelize.sync({ force: true });  // Create tables from scratch
  })
  .then(() => {
    console.log('✅ Sequelize models synchronized');
    
    // Initialize default data
    workoutService.initializeDefaultWorkouts();
    FoodSeeder.run();
    
    const PORT = process.env.PORT || 5000;
    const HOST = process.env.HOST || '0.0.0.0';
    
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Server running on ${HOST}:${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      if (process.env.DATABASE_URL) {
        console.log(`🗄️ Database: Neon PostgreSQL (Production)`);
      } else {
        console.log(`🗄️ Database: ${process.env.DB_NAME}@${process.env.DB_HOST}:${process.env.DB_PORT}`);
      }
    });
  })
  .catch(err => {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  });
