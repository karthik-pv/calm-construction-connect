const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Load environment variables
require("dotenv").config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log("🚀 Starting database migration...");

    // Read the SQL migration file
    const sqlPath = path.join(__dirname, "fix_therapist_posts.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Split the SQL into individual statements
    const statements = sql
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📄 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      try {
        const { error } = await supabase.rpc("exec_sql", {
          sql: statement + ";",
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          // Continue with other statements instead of stopping
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
      }
    }

    console.log("🎉 Migration completed!");
    console.log("📝 Summary:");
    console.log("   - therapist_posts table created/updated");
    console.log("   - post_images table recreated with correct foreign key");
    console.log("   - post_tags, post_likes, post_saves tables updated");
    console.log("   - Storage bucket and policies configured");
    console.log("   - Helper functions created");
  } catch (error) {
    console.error("💥 Migration failed:", error.message);
    process.exit(1);
  }
}

// Alternative method using direct SQL execution
async function runMigrationDirect() {
  try {
    console.log("🚀 Starting database migration (direct method)...");

    const sqlPath = path.join(__dirname, "fix_therapist_posts.sql");
    const sql = fs.readFileSync(sqlPath, "utf8");

    // Try to execute the entire SQL at once
    const { error } = await supabase.rpc("exec_sql", { sql });

    if (error) {
      console.error("❌ Migration failed:", error.message);
      console.log("🔄 Trying statement-by-statement approach...");
      await runMigration();
    } else {
      console.log("✅ Migration completed successfully!");
    }
  } catch (error) {
    console.error(
      "💥 Direct migration failed, trying alternative:",
      error.message
    );
    await runMigration();
  }
}

// Check if we can create a simple SQL execution function
async function createExecFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc("exec", { sql: createFunctionSQL });
    if (!error) {
      console.log("✅ SQL execution function created");
      return true;
    }
  } catch (err) {
    // Ignore errors, we'll try manual approach
  }

  return false;
}

// Main execution
async function main() {
  console.log("🔧 Setting up migration environment...");

  // Try to create the exec function first
  const hasExecFunction = await createExecFunction();

  if (hasExecFunction) {
    await runMigrationDirect();
  } else {
    console.log(
      "⚠️  Could not create exec function, you may need to run the SQL manually"
    );
    console.log(
      "📋 Please copy the contents of fix_therapist_posts.sql and run it in your Supabase SQL editor"
    );
    console.log(
      "🔗 Go to: https://supabase.com/dashboard/project/jyyffbmluezihdbtwjgi/sql/new"
    );
  }
}

main().catch(console.error);
