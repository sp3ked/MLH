import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys

# Configuration
CHROMEDRIVER_PATH = "C:/Users/Jk4li/Downloads/chromedriver-win64/chromedriver-win64/chromedriver.exe"
INSTAGRAM_USERNAME = "handsofficial11@gmail.com"
INSTAGRAM_PASSWORD = "handyman44$"
TARGET_LIVE_URL = "https://www.instagram.com/robertjenkins8697/live/"

# Global variables
driver = None


def init_instagram():
    """Initialize Selenium and log into Instagram. This should only run ONCE."""
    global driver

    if driver:  # Prevents multiple Chrome tabs opening
        return True

    print("🚀 Starting Instagram bot initialization...")
    service = Service(CHROMEDRIVER_PATH)
    driver = webdriver.Chrome(service=service)
    driver.maximize_window()

    try:
        # Login to Instagram
        print("📱 Logging into Instagram...")
        driver.get("https://www.instagram.com/accounts/login/")
        time.sleep(5)

        username_field = driver.find_element(By.NAME, "username")
        password_field = driver.find_element(By.NAME, "password")
        username_field.send_keys(INSTAGRAM_USERNAME)
        password_field.send_keys(INSTAGRAM_PASSWORD)
        password_field.send_keys(Keys.RETURN)
        time.sleep(5)
        print("✅ Instagram login successful")

        # Navigate to livestream
        print("🎥 Navigating to livestream...")
        driver.get(TARGET_LIVE_URL)
        time.sleep(5)

        # Click to dismiss any popups
        driver.find_element(By.TAG_NAME, "body").click()
        print("✅ Successfully navigated to livestream")

        return True
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        if driver:
            driver.quit()
        return False


def post_comment(comment: str):
    """Post a comment to the Instagram live stream."""
    global driver
    try:
        comment_box = driver.find_element(By.XPATH, "//textarea[@placeholder='Add a comment…']")
        comment_box.click()
        comment_box.send_keys(comment)
        time.sleep(1)
        comment_box.send_keys(Keys.RETURN)
        print(f"💬 Posted comment: {comment}")
        return True
    except Exception as e:
        print(f"❌ Error posting comment: {e}")
        return False


if __name__ == '__main__':
    if init_instagram():
        print("✨ Instagram bot initialized and ready to receive comments!")
    else:
        print("❌ Failed to initialize Instagram bot")

    # Keep the script running
    while True:
        time.sleep(10)
