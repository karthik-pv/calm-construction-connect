import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and Anon Key must be defined in environment variables"
  );
}

// Create a single supabase client for interacting with the database
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "x-application-name": "mindbuild-app",
    },
  },
});

// Log a successful connection attempt
console.log("Supabase client initialized");

// Utility function to check supabase connection
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("count(*)", { count: "exact", head: true });

    if (error) {
      console.error("Failed to connect to Supabase:", error);
      return false;
    }

    console.log("Successfully connected to Supabase");
    return true;
  } catch (err) {
    console.error("Error checking Supabase connection:", err);
    return false;
  }
}
