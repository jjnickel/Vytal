const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const { generateWorkoutPlan, getOpenAI } = require('./services/workout');
const authRouter = require('./routes/auth');
const { testConnection } = require('./config/database');
const WorkoutLog = require('./models/WorkoutLog');
const WeightEntry = require('./models/WeightEntry');
const NutritionEntry = require('./models/NutritionEntry');
const WorkoutPlan = require('./models/WorkoutPlan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use('/auth', authRouter);

// GET /api/workout-plan – Generate a workout plan for the user
app.get('/api/workout-plan', async (req, res) => {
  const { goal = 'general fitness', experience = 'beginner', userId } = req.query;
  try {
    const plan = await generateWorkoutPlan({ goal, experience });
    if (userId) {
      await WorkoutPlan.createOrUpdate({ userId: parseInt(userId), goal, experience, planData: plan });
    }
    res.json({ plan });
  } catch (error) {
    console.error('Error generating workout plan:', error);
    res.status(500).json({ message: 'Failed to generate workout plan' });
  }
});

// POST /api/trainer/chat – AI personal trainer chat
app.post('/api/trainer/chat', async (req, res) => {
  const { messages, userContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: 'Messages array is required' });
  }

  const openai = getOpenAI();
  if (!openai) {
    return res.status(503).json({
      message: 'AI service not configured. Please set OPENAI_API_KEY in your .env file.',
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
    const message = response.choices[0].message.content.trim();
    res.json({ message });
  } catch (error) {
    console.error('Error in trainer chat:', error);
    res.status(500).json({ message: 'Failed to get AI response' });
  }
});

// POST /api/trainer/analyze-image – Analyze exercise form from an image
app.post('/api/trainer/analyze-image', async (req, res) => {
  const { imageBase64, mimeType, prompt, userContext } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ message: 'Image data is required' });
  }

  const openai = getOpenAI();
  if (!openai) {
    return res.status(503).json({
      message: 'AI service not configured. Please set OPENAI_API_KEY in your .env file.',
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

    const message = response.choices[0].message.content.trim();
    res.json({ message });
  } catch (error) {
    console.error('Error analyzing image:', error);
    res.status(500).json({ message: 'Failed to analyze image' });
  }
});

function buildTrainerSystemPrompt(userContext) {
  let prompt =
    'You are Vytal, an expert AI personal trainer and nutritionist. You are knowledgeable, motivating, and provide specific, actionable fitness and nutrition advice.';

  if (userContext?.name) {
    prompt += ` You are talking with ${userContext.name}.`;
  }

  if (userContext?.goals) {
    const g = userContext.goals;
    prompt += ` Their daily nutrition targets are: ${g.calories} calories, ${g.protein}g protein, ${g.carbs}g carbs, ${g.fat}g fat.`;
  }

  prompt +=
    ' Keep responses concise (2-4 sentences for simple questions, more detail when instructions or plans are requested). Always be encouraging and professional. Use markdown formatting only for workout plans or detailed lists.';

  return prompt;
}

// POST /api/workout-log – Record a completed workout
app.post('/api/workout-log', async (req, res) => {
  try {
    const { userId, date, exercises } = req.body;
    if (!userId || !date || !Array.isArray(exercises)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const workoutLog = await WorkoutLog.create({ userId: parseInt(userId), date, exercises });
    res.json({ message: 'Workout logged', workoutLog });
  } catch (error) {
    console.error('Error logging workout:', error);
    res.status(500).json({ message: 'Failed to log workout', error: error.message });
  }
});

// GET /api/workout-log/:userId – Retrieve logged workouts for a user
app.get('/api/workout-log/:userId', async (req, res) => {
  try {
    const logs = await WorkoutLog.findByUserId(parseInt(req.params.userId));
    res.json({ logs });
  } catch (error) {
    console.error('Error fetching workout logs:', error);
    res.status(500).json({ message: 'Failed to fetch workout logs' });
  }
});

// POST /api/weight – Record a weight entry
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
    const entries = await WeightEntry.findByUserId(parseInt(req.params.userId));
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching weight entries:', error);
    res.status(500).json({ message: 'Failed to fetch weight entries' });
  }
});

// POST /api/nutrition/estimate – Estimate macros from meal description using AI
app.post('/api/nutrition/estimate', async (req, res) => {
  const { meal } = req.body;
  if (!meal) {
    return res.status(400).json({ message: 'Missing meal description' });
  }

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
            'You are a nutrition expert. Estimate the macronutrients for the given meal. Respond ONLY with valid JSON: {"calories": number, "protein": number, "carbs": number, "fat": number}. All values must be integers.',
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
    console.error('Error estimating nutrition:', error);
    res.json({ estimate: { meal, calories: 500, protein: 30, carbs: 50, fat: 15 } });
  }
});

// POST /api/nutrition – Record a nutrition entry
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
    const entries = await NutritionEntry.findByUserId(parseInt(req.params.userId));
    res.json({ entries });
  } catch (error) {
    console.error('Error fetching nutrition entries:', error);
    res.status(500).json({ message: 'Failed to fetch nutrition entries' });
  }
});

// Health check
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.json({
    status: 'ok',
    message: 'Backend is running',
    port: PORT,
    database: dbConnected ? 'connected' : 'disconnected',
    ai: getOpenAI() ? 'configured' : 'not configured (set OPENAI_API_KEY)',
  });
});

async function startServer() {
  const dbConnected = await testConnection();
  if (!dbConnected) {
    console.warn('Warning: Database connection failed. Some features may not work.');
  }
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Fitness backend listening on port ${PORT}`);
  });
}

startServer();
