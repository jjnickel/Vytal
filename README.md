# AI Fitness Prototype (Vytal)

A full-stack fitness tracking application prototype featuring AI-powered workout plan generation, nutrition tracking, and health monitoring. Built with React Native (Expo) and Express.js.

## 🎯 Features

- **User Authentication**: Secure registration and login with JWT tokens
- **AI-Powered Workout Plans**: Generate personalized workout plans using OpenAI GPT-4
- **Workout Tracking**: Log and track completed workouts with exercises, sets, reps, and weights
- **Nutrition Tracking**: Monitor daily nutrition goals (calories, protein, carbs, fat)
- **Health Dashboard**: View workout streaks, health scores, and progress metrics
- **Dark Theme UI**: Modern, responsive interface with theme support
- **Multi-Platform**: Built with Expo for iOS, Android, and Web support

## 🛠️ Tech Stack

### Frontend
- **React Native** (0.81.5) with **Expo** (~54.0.0)
- **React Navigation** (Stack & Bottom Tabs)
- **Axios** for API communication
- **Context API** for state management (Theme, Workout, Nutrition, Weight)

### Backend
- **Node.js** with **Express.js**
- **OpenAI API** for workout plan generation
- **JWT** for authentication
- **bcryptjs** for password hashing
- **CORS** enabled for cross-origin requests


## 📋 Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn**
- **Expo CLI** (install globally: `npm install -g expo-cli`)
- **OpenAI API Key** (optional, for AI workout generation)
- For mobile development:
  - **iOS**: Xcode (Mac only)
  - **Android**: Android Studio

## 🚀 Installation

### 1. Clone the repository

git clone <repository-url>
cd aifitness_prototype### 2. Backend Setup

cd backend
npm install
Create a `.env` file in the `backend` directory:

PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
JWT_SECRET=your_jwt_secret_here**Note**: The OpenAI API key is optional. Without it, the app will use a static fallback workout plan.

### 3. Frontend Setup

cd ../frontend
npm install## ⚙️ Configuration

### Backend API URL

Update the API base URL in `frontend/App.js` to match your local network IP address:

const API_BASE_URL = __DEV__ 
  ? 'http://YOUR_LOCAL_IP:3000'  // Change this to your local IP
  : 'http://localhost:3000';**Finding your local IP:**
- **Windows**: `ipconfig | findstr IPv4`
- **Mac/Linux**: `ifconfig` or `ip addr`

## 🏃 Running the Application

### Start the Backend Server

cd backend
npm startThe server will run on `http://localhost:3000` (or the port specified in your `.env` file).

### Start the Frontend

cd frontend
npm start
This will start the Expo development server. You can then:
- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Press `w` to open in web browser
- Scan the QR code with Expo Go app on your physical device

## 📡 API Endpoints

### Authentication
- `POST /api/register` - Register a new user
  - Body: `{ name, email, password }`
- `POST /api/login` - Login user
  - Body: `{ email, password }`

### Workouts
- `GET /api/workout-plan?goal={goal}&experience={experience}` - Generate workout plan
- `POST /api/workout-log` - Log a completed workout
  - Body: `{ userId, date, exercises: [{ name, sets, reps, weight, rpe }] }`
- `GET /api/workout-log/:userId` - Get user's workout logs

### Nutrition
- `POST /api/nutrition/estimate` - Estimate nutrition from meal description
  - Body: `{ meal: string }`

## ⚠️ Important Notes

- **This is a prototype**: Data is stored in-memory and will be lost when the server restarts
- **No persistent storage**: User accounts and workout logs are not saved to a database
- **Development only**: Not suitable for production use without additional security and persistence layers
- **OpenAI API**: Requires a valid API key for AI-powered workout generation. Without it, static plans are used.

## 🔮 Future Enhancements

- Database integration (PostgreSQL/MongoDB)
- Persistent user sessions
- Real-time nutrition API integration
- Workout history and analytics
- Social features and sharing
- Push notifications
- Offline mode support

## 📝 License

This project is a prototype and is provided as-is for demonstration purposes.

## 🤝 Contributing

This is a prototype project. Contributions and suggestions are welcome!

---

**Built with ❤️ using React Native and Express.js**
