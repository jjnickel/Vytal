// Entry point for the AI Fitness prototype backend.
//
// This Express server exposes a handful of REST endpoints that the
// React Native client can interact with. The goal of this server
// is to demonstrate the core interactions of the product without
// committing to a full production-grade implementation.
//
// Features provided:
//   * User registration and login (in‑memory only)
//   * Generating a simple workout plan using OpenAI (stubbed if no API key)
//   * Logging completed workouts
//   * Stubbing nutrition estimates
//
// To run this server:
//   1. Install dependencies with `npm install` in the backend directory
//   2. Create a .env file in the project root and optionally set
//      OPENAI_API_KEY to a valid API key
//   3. Run `npm start` to start the server on port 3000

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

// Attempt to load environment variables from .env
dotenv.config();

const { generateWorkoutPlan } = require('./services/workout');
const authRouter = require('./routes/auth');

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

// In‑memory data stores for this prototype. In production you would
// replace these with persistent storage such as PostgreSQL via Prisma.
const users = [];
const workoutLogs = [];

// Helper to generate a simple user ID. Real implementations would
// probably use a UUID or database auto increment.
function generateUserId() {
  return `u_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
}

// POST /api/register – Register a new account
// Expected body: { name: string, email: string, password: string }
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // Check if the email is already registered
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const user = { id: generateUserId(), name, email, password };
  users.push(user);
  res.json({ message: 'Registration successful', user: { id: user.id, name: user.name, email: user.email } });
});

// POST /api/login – Authenticate a user
// Expected body: { email: string, password: string }
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  // In a production environment you would return a JWT here
  res.json({ message: 'Login successful', user: { id: user.id, name: user.name, email: user.email } });
});

// GET /api/workout-plan – Generate a workout plan for the user
// Optionally accepts query parameters: goal, experience
app.get('/api/workout-plan', async (req, res) => {
  const { goal = 'general fitness', experience = 'beginner' } = req.query;
  try {
    const plan = await generateWorkoutPlan({ goal, experience });
    res.json({ plan });
  } catch (error) {
    console.error('Error generating workout plan:', error);
    res.status(500).json({ message: 'Failed to generate workout plan' });
  }
});

// POST /api/workout-log – Record a completed workout
// Expected body: { userId: string, date: ISO date, exercises: [{ name, sets, reps, weight, rpe }] }
app.post('/api/workout-log', (req, res) => {
  const { userId, date, exercises } = req.body;
  if (!userId || !date || !Array.isArray(exercises)) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  workoutLogs.push({ userId, date, exercises });
  res.json({ message: 'Workout logged' });
});

// GET /api/workout-log/:userId – Retrieve logged workouts for a user
app.get('/api/workout-log/:userId', (req, res) => {
  const { userId } = req.params;
  const logs = workoutLogs.filter(log => log.userId === userId);
  res.json({ logs });
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', port: PORT });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Fitness backend listening on port ${PORT}`);
  console.log(`Server accessible at:`);
  console.log(`  - http://localhost:${PORT}`);
  console.log(`  - http://127.0.0.1:${PORT}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend is running', port: PORT });
});