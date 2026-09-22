import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 4000,
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL,
  geminiApiKey: process.env.GEMINI_API_KEY,
  sarvamApiKey: process.env.SARVAM_API_KEY,
  plivoAuthId: process.env.PLIVO_AUTH_ID,
  plivoAuthToken: process.env.PLIVO_AUTH_TOKEN,
  plivoPhoneNumber: process.env.PLIVO_PHONE_NUMBER,
  jwtSecret: process.env.JWT_SECRET,
};