const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is not set. Server will not start.');
  process.exit(1);
}

const { generateWorkoutPlan, getOpenAI } = require('./services/workout');
const authRouter = require('./routes/auth');
const requireAuth = require('./middleware/auth');
const { assertOwner } = require('./middleware/auth');
const { testConnection } = require('./config/database');
const WorkoutLog = require('./models/WorkoutLog');
const WeightEntry = require('./models/WeightEntry');
const NutritionEntry = require('./models/NutritionEntry');
const WorkoutPlan = require('./models/WorkoutPlan');

const app = express();
const PORT = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS — allow configured origin or all origins in development
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : null;

app.use(cors({
  origin: allowedOrigins || true, // true = reflect request origin (dev-friendly)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing — generous limit for base64 image uploads
app.use(bodyParser.json({ limit: '10mb' }));

// Rate limiting: strict on auth, lenient on API
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20, // AI endpoints are expensive
  message: { message: 'Too many AI requests, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/auth', authLimiter);
app.use('/api', apiLimiter);

// Request logging (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ─── Auth routes (public) ────────────────────────────────────────────────────
app.use('/auth', authRouter);

// ─── Protected API routes ────────────────────────────────────────────────────
// All /api routes require a valid JWT token.
app.use('/api', requireAuth);

// GET /api/workout-plan – Generate a workout plan
app.get('/api/workout-plan', async (req, res) => {
  const { goal = 'general fitness', experience = 'beginner' } = req.query;
  try {
    const plan = await generateWorkoutPlan({ goal, experience });
    // Save plan linked to authenticated user
    await WorkoutPlan.createOrUpdate({
      userId: req.userId,
      goal,
      experience,
      planData: plan,
    }).catch(() => {}); // non-fatal
    res.json({ plan });
  } catch (error) {
    console.error('Error generating workout plan:', error);
    res.status(500).json({ message: 'Failed to generate workout plan' });
  }
});

// POST /api/trainer/chat – AI personal trainer chat
app.post('/api/trainer/chat', aiLimiter, async (req, res) => {
  const { messages, userContext } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'messages array is required' });
  }

  const openai = getOpenAI();
  if (!openai) {
    return res.status(503).json({
      message: 'AI service not configured. Set OPENAI_API_KEY in your .env file.',
    });
  }

  try {
    const systemPrompt = buildTrainerSystemPrompt(userContext);
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.8,
      max_tokens: 800,
    });
    res.json({ message: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Trainer chat error:', error);
    res.status(500).json({ message: 'Failed to get AI response' });
  }
});

// POST /api/trainer/analyze-image – Analyze exercise form from photo
app.post('/api/trainer/analyze-image', aiLimiter, async (req, res) => {
  const { imageBase64, mimeType, prompt, userContext } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ message: 'imageBase64 is required' });
  }

  const openai = getOpenAI();
  if (!openai) {
    return res.status(503).json({
      message: 'AI service not configured. Set OPENAI_API_KEY in your .env file.',
    });
  }

  try {
    const systemPrompt = buildTrainerSystemPrompt(userContext);
    const userPrompt = prompt || 'Please analyze this image and provide fitness coaching feedback on form, technique, or posture.';
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
            },
            { type: 'text', text: userPrompt },
          ],
        },
      ],
      max_tokens: 500,
    });
    res.json({ message: response.choices[0].message.content.trim() });
  } catch (error) {
    console.error('Image analysis error:', error);
    res.status(500).json({ message: 'Failed to analyze image' });
  }
});

function buildTrainerSystemPrompt(userContext) {
  let prompt =
    'You are Vytal, an expert AI personal trainer and nutritionist. Provide specific, actionable fitness and nutrition advice.';
  if (userContext?.name) prompt += ` You are talking with ${userContext.name}.`;
  if (userContext?.goals) {
    const g = userContext.goals;
    prompt += ` Their daily nutrition targets: ${g.calories} kcal, ${g.protein}g protein, ${g.carbs}g carbs, ${g.fat}g fat.`;
  }
  prompt += ' Be concise (2–4 sentences for simple questions, more for plans). Always be encouraging and professional.';
  return prompt;
}

// POST /api/workout-log – Record a completed workout
app.post('/api/workout-log', async (req, res) => {
  try {
    const { date, exercises } = req.body;
    if (!date || !Array.isArray(exercises)) {
      return res.status(400).json({ message: 'date and exercises array are required' });
    }
    const workoutLog = await WorkoutLog.create({ userId: req.userId, date, exercises });
    res.json({ message: 'Workout logged', workoutLog });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ message: 'Failed to log workout', error: error.message });
  }
});

// GET /api/workout-log/:userId – Retrieve workout history
app.get('/api/workout-log/:userId', async (req, res) => {
  if (!assertOwner(req, res)) return;
  try {
    const logs = await WorkoutLog.findByUserId(req.userId);
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    res.status(500).json({ message: 'Failed to fetch workout logs' });
  }
});

// POST /api/weight – Record a weight entry
app.post('/api/weight', async (req, res) => {
  try {
    const { weight, date } = req.body;
    if (!weight || !date) {
      return res.status(400).json({ message: 'weight and date are required' });
    }
    const entry = await WeightEntry.create({
      userId: req.userId,
      weight: parseFloat(weight),
      date,
    });
    res.json({ message: 'Weight logged', entry });
  } catch (error) {
    console.error('Error logging weight:', error);
    res.status(500).json({ message: 'Failed to log weight' });
  }
});

// GET /api/weight/:userId – Retrieve weight entries
app.get('/api/weight/:userId', async (req, res) => {
  if (!assertOwner(req, res)) return;
  try {
    const entries = await WeightEntry.findByUserId(req.userId);
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching weight entries:', error);
    res.status(500).json({ message: 'Failed to fetch weight entries' });
  }
});

// DELETE /api/weight/:entryId – Delete a weight entry
app.delete('/api/weight/:entryId', async (req, res) => {
  try {
    await WeightEntry.delete(parseInt(req.params.entryId, 10));
    res.json({ message: 'Weight entry deleted' });
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    res.status(500).json({ message: 'Failed to delete weight entry' });
  }
});

// POST /api/nutrition/estimate – Estimate macros from meal description
app.post('/api/nutrition/estimate', async (req, res) => {
  const { meal } = req.body;
  if (!meal) return res.status(400).json({ message: 'meal description is required' });

  const openai = getOpenAI();
  if (!openai) {
    return res.json({ estimate: { meal, calories: 500, protein: 30, carbs: 50, fat: 15 } });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a nutrition expert. Estimate macronutrients for the given meal. Respond ONLY with valid JSON: {"calories": number, "protein": number, "carbs": number, "fat": number}. All values must be integers.',
        },
        { role: 'user', content: `Estimate macros for: ${meal}` },
      ],
      temperature: 0.3,
      max_tokens: 100,
    });
    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const macros = JSON.parse(jsonMatch ? jsonMatch[0] : content);
    res.json({
      estimate: {
        meal,
        calories: Math.round(macros.calories) || 0,
        protein: Math.round(macros.protein) || 0,
        carbs: Math.round(macros.carbs) || 0,
        fat: Math.round(macros.fat) || 0,
      },
    });
  } catch (error) {
    console.error('Nutrition estimate error:', error);
    res.json({ estimate: { meal, calories: 500, protein: 30, carbs: 50, fat: 15 } });
  }
});

// POST /api/nutrition – Log a nutrition entry
app.post('/api/nutrition', async (req, res) => {
  try {
    const { meal, calories, protein, carbs, fat, date } = req.body;
    if (!meal || !date) {
      return res.status(400).json({ message: 'meal and date are required' });
    }
    const entry = await NutritionEntry.create({
      userId: req.userId,
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

// GET /api/nutrition/:userId – Retrieve nutrition entries (optionally filtered by date)
app.get('/api/nutrition/:userId', async (req, res) => {
  if (!assertOwner(req, res)) return;
  try {
    const { date } = req.query;
    const entries = date
      ? await NutritionEntry.findByUserIdAndDate(req.userId, date)
      : await NutritionEntry.findByUserId(req.userId);
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching nutrition entries:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition entries' });
  }
});

// DELETE /api/nutrition/:entryId – Delete a nutrition entry
app.delete('/api/nutrition/:entryId', async (req, res) => {
  try {
    await NutritionEntry.delete(parseInt(req.params.entryId, 10));
    res.json({ message: 'Nutrition entry deleted' });
  } catch (error) {
    console.error('Error deleting nutrition entry:', error);
    res.status(500).json({ message: 'Failed to delete nutrition entry' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    ai: getOpenAI() ? 'configured' : 'not configured',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

async function startServer() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('Warning: Database connection failed. Some features may not work.');
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Vytal backend listening on port ${PORT}`);
  });
}

startServer();
