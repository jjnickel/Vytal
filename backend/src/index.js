// Entry point for the AI Fitness prototype backend.
//
// This Express server exposes a handful of REST endpoints that the
// React Native client can interact with. The server uses MySQL for
// persistent data storage.
//
// Features provided:
//   * User registration and login (with MySQL persistence)
//   * Generating a simple workout plan using OpenAI (stubbed if no API key)
//   * Logging completed workouts (stored in MySQL)
//   * Weight tracking (stored in MySQL)
//   * Nutrition tracking (stored in MySQL)
//
// To run this server:
//   1. Install dependencies with `npm install` in the backend directory
//   2. Set up MySQL database (see DATABASE_SETUP.md)
//   3. Create a .env file with database credentials and other settings
//   4. Run `node src/database/init.js` to initialize the database
//   5. Run `npm start` to start the server on port 3000

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Attempt to load environment variables from .env
dotenv.config();

const { generateWorkoutPlan } = require('./services/workout');
const authRouter = require('./routes/auth');
const { testConnection } = require('./config/database');
const WorkoutLog = require('./models/WorkoutLog');
const WeightEntry = require('./models/WeightEntry');
const NutritionEntry = require('./models/NutritionEntry');
const WorkoutPlan = require('./models/WorkoutPlan');

const app = express();
const PORT = process.env.PORT || 3000;

// Use CORS to allow the React Native client to connect
app.use(cors());
app.use(bodyParser.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body ? JSON.stringify(req.body) : '');
  next();
});

app.use('/auth', authRouter);

// GET /api/workout-plan – Generate a workout plan for the user
// Optionally accepts query parameters: goal, experience, userId
app.get('/api/workout-plan', async (req, res) => {
  const { goal = 'general fitness', experience = 'beginner', userId } = req.query;
  try {
    const plan = await generateWorkoutPlan({ goal, experience });
    
    // Optionally save the plan to database if userId is provided
    if (userId) {
      await WorkoutPlan.createOrUpdate({ userId: parseInt(userId), goal, experience, planData: plan });
    }
    
    res.json({ plan });
  } catch (error) {
    console.error('Error generating workout plan:', error);
    res.status(500).json({ message: 'Failed to generate workout plan' });
  }
});

// POST /api/workout-log – Record a completed workout
// Expected body: { userId: number, date: ISO date, exercises: [{ name, sets, reps, weight, rpe }] }
app.post('/api/workout-log', async (req, res) => {
  try {
    const { userId, date, exercises } = req.body;
    console.log('Workout log request:', { userId, date, exercisesCount: exercises?.length });
    
    if (!userId || !date || !Array.isArray(exercises)) {
      console.error('Missing required fields:', { userId, date, exercises });
      return res.status(400).json({ message: 'Missing required fields', details: { userId: !!userId, date: !!date, exercises: Array.isArray(exercises) } });
    }
    
    const workoutLog = await WorkoutLog.create({ userId: parseInt(userId), date, exercises });
    console.log('Workout logged successfully:', workoutLog.id);
    res.json({ message: 'Workout logged', workoutLog });
  } catch (error) {
    console.error('Error logging workout:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Failed to log workout', error: error.message });
  }
});

// GET /api/workout-log/:userId – Retrieve logged workouts for a user
app.get('/api/workout-log/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const logs = await WorkoutLog.findByUserId(parseInt(userId));
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    res.status(500).json({ message: 'Failed to fetch workout logs' });
  }
});

// POST /api/weight – Record a weight entry
// Expected body: { userId: number, weight: number, date: ISO date }
app.post('/api/weight', async (req, res) => {
  try {
    const { userId, weight, date } = req.body;
    if (!userId || !weight || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const entry = await WeightEntry.create({ userId: parseInt(userId), weight: parseFloat(weight), date });
    res.json({ message: 'Weight logged', entry });
  } catch (error) {
    console.error('Error logging weight:', error);
    res.status(500).json({ message: 'Failed to log weight' });
  }
});

// GET /api/weight/:userId – Retrieve weight entries for a user
app.get('/api/weight/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const entries = await WeightEntry.findByUserId(parseInt(userId));
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching weight entries:', error);
    res.status(500).json({ message: 'Failed to fetch weight entries' });
  }
});

// POST /api/nutrition/estimate – Stub endpoint to estimate nutrition from meal name
// Expected body: { meal: string }
app.post('/api/nutrition/estimate', (req, res) => {
  const { meal } = req.body;
  if (!meal) {
    return res.status(400).json({ message: 'Missing meal description' });
  }
  // Fake macro breakdown for the prototype
  const estimate = {
    meal,
    calories: 500,
    protein: 30,
    carbs: 50,
    fat: 15
  };
  res.json({ estimate });
});

// POST /api/nutrition – Record a nutrition entry
// Expected body: { userId: number, meal: string, calories: number, protein: number, carbs: number, fat: number, date: ISO date }
app.post('/api/nutrition', async (req, res) => {
  try {
    const { userId, meal, calories, protein, carbs, fat, date } = req.body;
    if (!userId || !meal || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const entry = await NutritionEntry.create({
      userId: parseInt(userId),
      meal,
      calories: parseInt(calories) || 0,
      protein: parseFloat(protein) || 0,
      carbs: parseFloat(carbs) || 0,
      fat: parseFloat(fat) || 0,
      date,
    });
    res.json({ message: 'Nutrition logged', entry });
  } catch (error) {
    console.error('Error logging nutrition:', error);
    res.status(500).json({ message: 'Failed to log nutrition' });
  }
});

// GET /api/nutrition/:userId – Retrieve nutrition entries for a user
app.get('/api/nutrition/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const entries = await NutritionEntry.findByUserId(parseInt(userId));
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching nutrition entries:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition entries' });
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({ 
    status: 'ok', 
    message: 'Backend is running', 
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected'
  });
});

// Initialize database connection and start server
async function startServer() {
  // Test database connection
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('⚠️  Warning: Database connection failed. Some features may not work.');
    console.warn('   Make sure MySQL is running and database credentials are correct in .env');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Fitness backend listening on port ${PORT}`);
    console.log(`Server accessible at:`);
    console.log(`  - http://localhost:${PORT}`);
    console.log(`  - http://127.0.0.1:${PORT}`);
  });
}

startServer();