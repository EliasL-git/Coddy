require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const User = require("./models/User");

const identifier = process.argv[2];

if (!identifier) {
  console.error("Usage: npm run promote -- <email or username>");
  process.exit(1);
}

async function promote() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/coddy",
  );

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  });

  if (!user) {
    console.error(`No user found matching "${identifier}"`);
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(
      `"${user.username}" (${user.email}) is already an admin. Nothing changed.`,
    );
    process.exit(0);
  }

  user.role = "admin";
  await user.save();

  console.log(`✓ Promoted "${user.username}" (${user.email}) to admin.`);
  process.exit(0);
}

promote().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
