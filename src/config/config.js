require('dotenv').config();

const config = {
  // Server configuration
  server: {
    port: process.env.PORT || 5000,
    host: process.env.HOST || 'localhost',
    nodeEnv: process.env.NODE_ENV || 'development',
  },

  // Database configuration
  database: {
    name: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: process.env.DB_DIALECT || 'mysql',
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRE || '7d',
  },

  // CORS configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Upload configuration
  upload: {
    maxFileSize: process.env.MAX_FILE_SIZE || 5242880, // 5MB
    uploadDir: process.env.UPLOAD_DIR || 'uploads',
  },

  // External APIs
  apis: {
    food: {
      key: process.env.FOOD_API_KEY,
      url: process.env.FOOD_API_URL,
    },
  },

  // Application limits
  limits: {
    jsonLimit: process.env.JSON_LIMIT || '10mb',
    requestTimeout: process.env.REQUEST_TIMEOUT || 30000,
  },
};

// Validation function
const validateConfig = () => {
  const required = [
    'database.name',
    'database.username', 
    'database.password',
    'jwt.secret'
  ];

  const missing = [];
  
  required.forEach(path => {
    const keys = path.split('.');
    let current = config;
    
    for (const key of keys) {
      if (!current[key]) {
        missing.push(path);
        break;
      }
      current = current[key];
    }
  });

  if (missing.length > 0) {
    console.error('❌ Missing required configuration:');
    missing.forEach(path => console.error(`  - ${path}`));
    throw new Error('Configuration validation failed');
  }
};

// Validate configuration on load
if (config.server.nodeEnv === 'production') {
  validateConfig();
}

module.exports = config; 