const OpenAI = require('openai');

let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function generateWorkoutPlan({ goal, experience }) {
  if (openai) {
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'You are a helpful fitness coach.' },
          {
            role: 'user',
            content: `Create a one-week workout plan for a ${experience} user whose goal is ${goal}. List each day with exercises, sets, reps and rest intervals.`,
          },
        ],
        temperature: 0.7,
      });
      const text = response.choices[0].message.content.trim();
      return { type: 'ai', content: text };
    } catch (error) {
      console.warn('OpenAI API call failed, falling back to static plan:', error.message);
    }
  }
  return {
    type: 'static',
    content: `Monday: Full body circuit (3 rounds)\n  - Squats: 15 reps\n  - Push‑ups: 12 reps\n  - Lunges: 10 reps per leg\n  - Plank: 30 seconds\n\nTuesday: Rest or light cardio 20–30 minutes\n\nWednesday: Upper body\n  - Dumbbell bench press: 3x12\n  - Bent‑over row: 3x12\n  - Shoulder press: 3x12\n  - Bicep curls: 3x15\n\nThursday: Rest\n\nFriday: Lower body\n  - Deadlift: 3x10\n  - Bulgarian split squats: 3x12 per leg\n  - Leg curls: 3x15\n  - Calf raises: 3x20\n\nSaturday: Core & conditioning\n  - Mountain climbers: 3x30 seconds\n  - Russian twists: 3x20\n  - Bicycle crunches: 3x20\n  - Jump rope or brisk walk: 15 minutes\n\nSunday: Rest or active recovery (yoga, stretching)`,
  };
}

module.exports = { generateWorkoutPlan, getOpenAI: () => openai };
