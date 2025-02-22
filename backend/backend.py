from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import requests

app = Flask(__name__)
CORS(app)  # This allows your React Native app to make requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.route('/post-location', methods=['POST'])
def post_location():
    try:
        data = request.json
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        
        # Log the received coordinates
        logger.info(f"Received coordinates: Lat={latitude}, Long={longitude}")
        
        # Forward the location to the Instagram bot
        message = f"Location: ({latitude}, {longitude})"
        if latitude == 40.429307 and longitude == -86.922374:
            message = "You are at the Co-Rec!"
        
        response = requests.post(INSTAGRAM_BOT_URL, json={"message": message})
        return jsonify(response.json()), response.status_code
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    logger.info("Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True)
