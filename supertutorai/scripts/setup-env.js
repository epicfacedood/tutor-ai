const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

// Check if .env file exists
if (fs.existsSync(envPath)) {
  console.log("✅ .env file already exists");
} else {
  console.log("⚠️ .env file not found");

  // Check if .env.example exists
  if (fs.existsSync(envExamplePath)) {
    console.log("📄 Creating .env file from .env.example");

    // Read .env.example
    const envExample = fs.readFileSync(envExamplePath, "utf8");

    // Create interface for reading from command line
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    // Ask for API key
    rl.question(
      "Enter your Claude API key (leave blank to use placeholder): ",
      (apiKey) => {
        // Replace placeholder with actual API key or keep placeholder
        let envContent = envExample;

        if (apiKey.trim()) {
          envContent = envExample.replace(
            "your_claude_api_key_here",
            apiKey.trim()
          );
          console.log("🔑 Using provided API key");
        } else {
          console.log(
            "⚠️ Using placeholder API key - remember to update it later"
          );
        }

        // Write to .env file
        fs.writeFileSync(envPath, envContent);
        console.log("✅ .env file created successfully");

        rl.close();
      }
    );
  } else {
    console.error("❌ .env.example file not found. Cannot create .env file.");
  }
}

// Remind about gitignore
const gitignorePath = path.join(rootDir, ".gitignore");
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, "utf8");
  if (!gitignore.includes(".env")) {
    console.warn(
      "⚠️ Warning: .env is not in your .gitignore file. Add it to prevent committing secrets."
    );
  } else {
    console.log("✅ .env is properly listed in .gitignore");
  }
} else {
  console.warn(
    "⚠️ Warning: No .gitignore file found. Create one and add .env to it."
  );
}

console.log(
  "\n📝 Remember: Never commit your actual API keys or secrets to version control!"
);
console.log(
  "🔄 If you need to share environment configurations, use .env.example with placeholders."
);
