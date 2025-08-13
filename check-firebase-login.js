const { execSync } = require("child_process");

try {
    // Run `firebase login:list` to see if any accounts are logged in
    const output = execSync("firebase login:list", { encoding: "utf8" });

    if (output.includes("No authorized accounts")) {
        console.error("\n❌ You are not logged into Firebase.");
        console.error("➡ Run: firebase login\n");
        process.exit(1); // Exit with error
    } else {
        console.log("✅ Firebase login detected. Proceeding with deploy...");
    }
} catch (err) {
    console.error("\n⚠️ Could not check Firebase login status.");
    console.error("Make sure Firebase CLI is installed and try again.");
    process.exit(1);
}