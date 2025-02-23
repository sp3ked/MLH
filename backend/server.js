require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Builder, By, until, Key } = require('selenium-webdriver');

const app = express();

// Update CORS settings
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(bodyParser.json());

// Global driver, starts null
let driver = null;

/**
 * Initialize Instagram: Login + Navigate to Live
 * Called on-demand (only when needed), not on server start.
 */
async function initInstagram() {
  console.log("Launching Chrome...");
  driver = await new Builder().forBrowser('chrome').build();

  try {
    console.log("Navigating to Instagram login...");
    await driver.get('https://www.instagram.com/accounts/login/');
    await driver.sleep(5000);

    console.log("Entering login details...");
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
    console.error("Instagram Login Failed:", error);
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
      console.log("Looking for comment box...");
      // Wait longer for the comment box and be more specific with selector
      const commentBox = await driver.wait(
        until.elementLocated(By.css('textarea[aria-label="Add a comment…"], textarea[placeholder="Add a comment…"]')),
        10000
      );
      console.log("Found comment box, clicking...");
      await driver.sleep(2000); // More wait time

      // Try to scroll the comment box into view
      await driver.executeScript("arguments[0].scrollIntoView(true);", commentBox);
      await driver.sleep(1000);

      await commentBox.click();
      console.log("Clicked comment box");
      await driver.sleep(1000);

      // Clear with JavaScript and then sendKeys
      await driver.executeScript("arguments[0].value = '';", commentBox);
      await commentBox.clear();
      await driver.sleep(500);

      console.log("Typing comment:", comment);
      await commentBox.sendKeys(comment);
      await driver.sleep(1000);

      // Hit the send button
      console.log("Sending comment...");
      await commentBox.sendKeys(Key.RETURN);
      await driver.sleep(1000);

      console.log("Comment posted successfully!");
      return true;
    } catch (error) {
      attempts++;
      console.log(`Attempt ${attempts} failed:`, error.message);
      await driver.sleep(2000); // Longer wait between retries

      if (attempts === maxAttempts) {
        throw new Error(`Failed to post comment: ${error.message}`);
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
  console.log('Received fact update:', req.body);
  
  try {
    if (!driver || !instagramReady) {
      console.log("Instagram not ready, initializing...");
      await initInstagram();
      instagramReady = true;
    }

    const { fact } = req.body;
    const comment = `Fact: ${fact} Keep walking to discover more!`;

    console.log("Attempting to post comment:", comment);
    await postComment(comment);
    
    console.log("Comment posted. Returning success.");
    res.json({ 
      message: "Comment posted successfully!", 
      comment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error posting comment:", error);
    
    // Try to recover from session errors
    if (error.message.includes("session") || error.message.includes("stale") || error.message.includes("element")) {
      instagramReady = false;
      console.log("Session error detected, reinitializing...");
      try {
        if (driver) {
          await driver.quit();
          driver = null;
        }
        await initInstagram();
        instagramReady = true;
        // Try posting again
        return res.status(503).json({
          error: "Session reset, please retry",
          shouldRetry: true
        });
      } catch (reinitError) {
        console.error("Failed to reinitialize:", reinitError);
      }
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
 * Modified server startup to bind to all interfaces
 */
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Network: http://172.20.10.6:${PORT}`);
  
  // Initialize Instagram on startup
  try {
    await initInstagram();
    instagramReady = true;
    console.log("Instagram initialized and ready!");
  } catch (error) {
    console.error("Initial Instagram setup failed:", error);
    // Will retry on first request
  }
});

// Add auto-reconnect on errors
setInterval(async () => {
  if (!instagramReady || !driver) {
    console.log("Attempting to reconnect to Instagram...");
    try {
      await initInstagram();
      instagramReady = true;
      console.log("Successfully reconnected to Instagram!");
    } catch (error) {
      console.error("Reconnection attempt failed:", error);
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
