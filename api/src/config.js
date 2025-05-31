const port = process.env.API_PORT || 3000;

const jwtSecret = process.env.JWT_SECRET;
const uri = process.env.MONGODB_URI;

const username = process.env.ADMIN_USERNAME;
const password = process.env.ADMIN_PASSWORD;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabaseBucketName = process.env.SUPABASE_BUCKET_NAME;

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
