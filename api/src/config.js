// {PATH_TO_THE_PROJECT}/api/src/config/index.js

// Load environment variables
require("dotenv").config();

const port = process.env.PORT || 8000;

const jwtSecret = process.env.JWT_SECRET;
const uri = process.env.MONGODB_URI;
const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseBucketName = process.env.SUPABASE_BUCKET_NAME;

// It's a good practice to check if critical variables are defined
if (!jwtSecret || !uri || !username || !password || !supabaseServiceKey) {
  throw new Error("Missing critical environment variables. Check your .env file.");
}

module.exports = {
  jwtSecret,
  uri,
  username,
  password,
  supabaseUrl,
  supabaseAnonKey,
  supabaseServiceKey,
  supabaseBucketName,
  port,
};
