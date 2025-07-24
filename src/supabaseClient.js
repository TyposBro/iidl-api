// {PATH_TO_THE_PROJECT}/api/src/supabaseClient.js

require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const { supabaseUrl, supabaseServiceKey } = require("./config");

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
