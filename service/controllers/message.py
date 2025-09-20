from flask import current_app, jsonify
from models.test_message import TestMessage

def get_test_message():
    """Fetches the first message from the 'test' table."""
    current_app.logger.info("Request received for /api/message")
    try:
        message_from_db = TestMessage.query.first()
        if message_from_db:
            return jsonify(message_from_db.to_json())
        else:
            return jsonify({"error": "No message found in the database"}), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching test message: {e}")
        return jsonify({"error": "Failed to fetch message"}), 500
