const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rootDir = path.join(__dirname, "..");
const envPath = path.join(rootDir, ".env");
const envExamplePath = path.join(rootDir, ".env.example");

// Create interface for reading from command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(
  "⚠️ This script will reset your .env file and remove your API key."
);
console.log(
  "⚠️ This is useful before committing changes to ensure no secrets are exposed."
);

rl.question("Are you sure you want to continue? (y/n): ", (answer) => {
  if (answer.toLowerCase() === "y" || answer.toLowerCase() === "yes") {
    // Check if .env file exists
    if (fs.existsSync(envPath)) {
      // Check if .env.example exists
      if (fs.existsSync(envExamplePath)) {
        // Read .env.example
        const envExample = fs.readFileSync(envExamplePath, "utf8");

        // Write .env.example content to .env
        fs.writeFileSync(envPath, envExample);
        console.log("✅ .env file has been reset with placeholder values");
      } else {
        console.error(
          "❌ .env.example file not found. Cannot reset .env file."
        );
      }
    } else {
      console.log("❌ .env file not found. Nothing to reset.");
    }
  } else {
    console.log("Operation cancelled.");
  }

  rl.close();
});
