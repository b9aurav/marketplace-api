import { DataSource } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Role } from "../common/decorators/roles.decorator";
import { createClient } from "@supabase/supabase-js";

import dataSourceConfig from "../../ormconfig";
import * as readline from "readline";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function createUser(email: string, password?: string, name?: string) {
  if (!email) {
    console.error("Error: Email is required");
    console.log("Usage: npm run create-user <email> [password] [name]");
    process.exit(1);
  }

  // Get password and name if not provided
  if (!password) {
    password = await askQuestion(
      "Enter password for user (min 6 characters): ",
    );
    if (password.length < 6) {
      console.error("Error: Password must be at least 6 characters long");
      process.exit(1);
    }
  }

  if (!name) {
    name =
      (await askQuestion("Enter name for user (default: Test User): ")) ||
      "Test User";
  }

  // Close readline interface
  rl.close();

  // Create a new DataSource instance using the shared configuration
  const dataSource = new DataSource({
    ...dataSourceConfig.options,
  });

  // Initialize Supabase client directly
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error("Error: Supabase configuration missing");
    console.log(
      "Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in your .env file",
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Initialize the data source
    await dataSource.initialize();
    console.log("Database connection initialized");

    const userRepository = dataSource.getRepository(User);

    // Check if user already exists in local database
    const existingUser = await userRepository.findOne({ where: { email } });

    if (existingUser) {
      console.log(`User with email ${email} already exists in database`);
      return;
    }

    console.log(`User with email ${email} not found. Creating new user...`);

    try {
      // Step 1: Register user with Supabase
      console.log("Registering user with Supabase...");
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const supabaseUser = data.user;

      if (!supabaseUser) {
        throw new Error("Failed to create user in Supabase");
      }

      console.log(
        `Success: User registered in Supabase with ID: ${supabaseUser.id}`,
      );

      // Step 2: Create user in local database with user role
      console.log("Creating user in local database...");
      const newUser = userRepository.create({
        id: supabaseUser.id, // Use Supabase user ID
        email: email,
        name: name,
        role: Role.USER, // Create as a regular user
        is_active: true,
      });

      await userRepository.save(newUser);
      console.log(`Success: User ${email} created in local database`);

      console.log("\n✅ User creation completed successfully!");
      console.log(`📧 Email: ${email}`);
      console.log(`👤 Name: ${name}`);
      console.log(`🔑 Role: USER`);
      console.log("\nThe user can now log in with their email and password.");
    } catch (supabaseError) {
      console.error("Supabase registration failed:", supabaseError.message);

      // Check if user already exists in Supabase
      if (
        supabaseError.message?.includes("already registered") ||
        supabaseError.message?.includes("already been registered")
      ) {
        console.log(
          "User already exists in Supabase. Attempting to create local database entry...",
        );

        try {
          // Try to sign in to get the user ID
          const { data: signInData, error: signInError } =
            await supabase.auth.signInWithPassword({
              email,
              password,
            });

          if (signInError) {
            throw signInError;
          }

          const existingSupabaseUser = signInData.user;

          if (existingSupabaseUser) {
            // Create user in local database with Supabase ID
            const newUser = userRepository.create({
              id: existingSupabaseUser.id,
              email: email,
              name: name,
              role: Role.USER,
              is_active: true,
            });

            await userRepository.save(newUser);
            console.log(
              `Success: User ${email} created in local database using existing Supabase account`,
            );
          } else {
            throw new Error("Could not retrieve existing Supabase user");
          }
        } catch (signInError) {
          console.error(
            "Failed to sign in with existing Supabase account:",
            signInError.message,
          );
          console.log("\n❌ Could not create user. Please ensure:");
          console.log(
            "1. The email/password combination is correct if user exists in Supabase",
          );
          console.log("2. Supabase is properly configured");
          process.exit(1);
        }
      } else {
        console.log("\n❌ Failed to create user. Please ensure:");
        console.log("1. Supabase is properly configured");
        console.log("2. The email is valid and not already registered");
        console.log("3. The password meets requirements (min 6 characters)");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("Database error:", error.message);
    process.exit(1);
  } finally {
    // Close the data source connection
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("Database connection closed");
    }
  }
}

// Get arguments from command line
const email = process.argv[2];
const password = process.argv[3];
const name = process.argv[4];

createUser(email, password, name);
