// Test SMTP configuration
const nodemailer = require("nodemailer");

const config = {
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "syedishaq0123@gmail.com",
    pass: "ceak uuxz sqrj eosv"
  }
};

async function testSMTP() {
  console.log("🔍 Testing SMTP configuration...\n");
  console.log(`📧 Email: ${config.auth.user}`);
  console.log(`🔐 Password: ${config.auth.pass}`);
  console.log(`🖥️  Host: ${config.host}:${config.port}\n`);

  try {
    const transporter = nodemailer.createTransport(config);

    // Verify connection
    console.log("⏳ Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection successful!\n");

    // Test send (optional - sends a test email)
    console.log("📨 Attempting test email send...");
    const info = await transporter.sendMail({
      from: `"TalentTrack Test" <${config.auth.user}>`,
      to: config.auth.user,
      subject: "SMTP Test - TalentTrack",
      html: "<h2>✅ SMTP Configuration is Working!</h2><p>This is a test email to verify your SMTP settings.</p>"
    });

    console.log("✅ Test email sent successfully!");
    console.log(`📌 Message ID: ${info.messageId}\n`);

    console.log("🎉 SMTP credentials are valid and working!");
    process.exit(0);
  } catch (error) {
    console.error("❌ SMTP Test Failed:\n");
    console.error(`Error: ${error.message}\n`);
    
    if (error.code === "EAUTH") {
      console.error("🔴 Authentication Error: Invalid email or password");
    } else if (error.code === "ECONNREFUSED") {
      console.error("🔴 Connection Error: Could not connect to SMTP server");
    } else if (error.code === "ETIMEDOUT") {
      console.error("🔴 Timeout Error: Connection to SMTP server timed out");
    }

    console.error("\n📋 Troubleshooting tips:");
    console.error("1. Verify Gmail account has 2FA enabled");
    console.error("2. Generate a new App Password at: https://myaccount.google.com/apppasswords");
    console.error("3. Use the full 16-character app password (no spaces in stored version)");
    console.error("4. Ensure SMTP_HOST=smtp.gmail.com and SMTP_PORT=587\n");
    
    process.exit(1);
  }
}

testSMTP();
