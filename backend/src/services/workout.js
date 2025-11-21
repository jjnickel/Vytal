// services/workout.js
//
// This module encapsulates the logic for generating a workout plan. In
// production this would integrate with OpenAI's GPT API to generate a
// customized program based on the user's goals, experience and history.
// For the purposes of this prototype the function returns a static
// structure to illustrate how such integration might look.

const { Configuration, OpenAIApi } = require('openai');

// Create an OpenAI client if an API key is available. If no key is
// provided the client remains undefined and we will fallback to a
// locally generated plan instead.
let openai;
if (process.env.OPENAI_API_KEY) {
  const configuration = new Configuration({ apiKey: process.env.OPENAI_API_KEY });
  openai = new OpenAIApi(configuration);
}

/**
 * Generate a workout plan for a user.
 * @param {Object} params - Parameters for plan generation.
 * @param {string} params.goal - The fitness goal (e.g. 'strength', 'fat loss').
 * @param {string} params.experience - The user's experience level (e.g. 'beginner').
 * @returns {Promise<Object>} A workout plan object
 */
async function generateWorkoutPlan({ goal, experience }) {
  // If we have an OpenAI client configured, attempt to generate a plan
  if (openai) {
    try {
      const prompt = `You are an AI personal trainer. Create a one‑week workout plan for a ${experience} user whose goal is ${goal}. List each day with exercises, sets, reps and rest intervals.`;
      const response = await openai.createChatCompletion({
        model: 'gpt-4o',
        messages: [ { role: 'system', content: 'You are a helpful fitness coach.' }, { role: 'user', content: prompt } ],
        temperature: 0.7,
      });
      const text = response.data.choices[0].message.content.trim();
      return { type: 'ai', content: text };
    } catch (error) {
      console.warn('OpenAI API call failed, falling back to static plan:', error.message);
    }
  }
  // Fallback plan if no API key is present or request fails
  return {
    type: 'static',
    content: `Monday: Full body circuit (3 rounds)\n  - Squats: 15 reps\n  - Push‑ups: 12 reps\n  - Lunges: 10 reps per leg\n  - Plank: 30 seconds\n\nTuesday: Rest or light cardio 20–30 minutes\n\nWednesday: Upper body\n  - Dumbbell bench press: 3x12\n  - Bent‑over row: 3x12\n  - Shoulder press: 3x12\n  - Bicep curls: 3x15\n\nThursday: Rest\n\nFriday: Lower body\n  - Deadlift: 3x10\n  - Bulgarian split squats: 3x12 per leg\n  - Leg curls: 3x15\n  - Calf raises: 3x20\n\nSaturday: Core & conditioning\n  - Mountain climbers: 3x30 seconds\n  - Russian twists: 3x20\n  - Bicycle crunches: 3x20\n  - Jump rope or brisk walk: 15 minutes\n\nSunday: Rest or active recovery (yoga, stretching)`
  };
}

module.exports = { generateWorkoutPlan };