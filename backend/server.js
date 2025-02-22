require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Builder, By, until, Key } = require('selenium-webdriver');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Global driver, starts null
let driver = null;

/**
 * Initialize Instagram: Login + Navigate to Live
 * Called on-demand (only when needed), not on server start.
 */
async function initInstagram() {
  console.log("🚀 Launching Chrome...");
  driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("📱 Navigating to Instagram login...");
    await driver.get('https://www.instagram.com/accounts/login/');
    await driver.sleep(5000);

    console.log("📱 Entering login details...");
    await driver.findElement(By.name('username')).sendKeys(process.env.INSTAGRAM_USERNAME);
    await driver.findElement(By.name('password')).sendKeys(process.env.INSTAGRAM_PASSWORD, Key.RETURN);
    await driver.sleep(5000); // wait for login

    // Dismiss any popups
    try {
      let notNowButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Not Now')]")), 5000);
      await notNowButton.click();
      console.log("Dismissed 'Save Info' popup.");
    } catch (e) {
      console.log("No 'Save Info' popup found.");
    }

    console.log("Successfully logged into Instagram!");

    console.log("Navigating to live stream...");
    await driver.get(process.env.TARGET_LIVE_URL);
    await driver.sleep(5000);
    console.log("Live stream page loaded!");
  } catch (error) {
    console.error("❌ Instagram Login Failed:", error);
    if (driver) await driver.quit();
    driver = null;
  }
}

// Global status tracker
let instagramReady = false;

async function postComment(comment) {
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      // Find the comment input area and click it
      const commentBox = await driver.wait(
        until.elementLocated(By.css('textarea[aria-label="Add a comment…"]')),
        5000
      );
      await driver.sleep(1000); // Short pause
      await commentBox.click();
      await driver.sleep(500);

      // Clear any existing text
      await commentBox.clear();
      await driver.sleep(500);

      // Type the comment
      await commentBox.sendKeys(comment);
      await driver.sleep(500);

      // Send the comment
      await commentBox.sendKeys(Key.RETURN);
      console.log(`✅ Comment posted successfully: ${comment}`);
      return true;
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts} failed. ${maxAttempts - attempts} attempts remaining.`);
      await driver.sleep(1000); // Wait before retry

      if (attempts === maxAttempts) {
        console.error("❌ Failed to post comment after multiple attempts:", error.message);
        throw new Error("Failed to post comment after multiple attempts");
      }
    }
  }
}

/**
 * GET /status:
 * Check if Instagram is ready
 */
app.get('/status', (req, res) => {
  res.json({ 
    ready: instagramReady,
    message: instagramReady ? "Instagram ready" : "Instagram not initialized"
  });
});

/**
 * POST /send-comment:
 * Just post the comment, initialization handled separately
 */
app.post('/send-comment', async (req, res) => {
  try {
    if (!instagramReady || !driver) {
      return res.status(503).json({ 
        error: "Instagram not ready",
        message: "Server is still initializing or needs reconnection"
      });
    }

    const { latitude, longitude } = req.body;
    const comment = `Location Update - Lat: ${latitude.toFixed(6)}, Long: ${longitude.toFixed(6)}`;

    console.log("Posting comment:", comment);
    await postComment(comment);
    
    res.json({ 
      message: "Comment posted successfully!", 
      comment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error posting comment:", error.message);
    
    // If session error, mark as not ready
    if (error.message.includes("session") || error.message.includes("stale")) {
      instagramReady = false;
      // Try to reconnect in background
      initInstagram().catch(console.error);
    }

    res.status(500).json({ 
      error: `Failed to post comment: ${error.message}`,
      shouldRetry: true
    });
  }
});

/**
 * POST /stop:
 * Quit Selenium and reset driver
 */
app.post('/stop', async (req, res) => {
  if (driver) {
    await driver.quit();
    driver = null;
    console.log("Closed Instagram session.");
    res.json({ message: "Stopped bot" });
  } else {
    res.status(400).json({ error: "No active session" });
  }
});

/**
 * Modified server startup
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  
  // Initialize Instagram on startup
  try {
    await initInstagram();
    instagramReady = true;
    console.log("✅ Instagram initialized and ready!");
  } catch (error) {
    console.error("❌ Initial Instagram setup failed:", error);
    // Will retry on first request
  }
});

// Add auto-reconnect on errors
setInterval(async () => {
  if (!instagramReady || !driver) {
    console.log("🔄 Attempting to reconnect to Instagram...");
    try {
      await initInstagram();
      instagramReady = true;
      console.log("✅ Successfully reconnected to Instagram!");
    } catch (error) {
      console.error("❌ Reconnection attempt failed:", error);
    }
  }
}, 60000); // Check every minute

// Handle graceful shutdown
process.on('SIGINT', async () => {
  if (driver) {
    console.log("Shutting down, closing Instagram...");
    await driver.quit();
  }
  process.exit();
});
