from flask import current_app, jsonify, request
from models.contact import Contact
from models import db
import re

# simple email regex (server-side check)
EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')

def _sanitize(s: str) -> str:
    if s is None:
        return ''
    # remove control chars, angle brackets and backticks and null bytes
    s = re.sub(r'[\x00-\x1f\x7f<>`]', '', s)
    # collapse whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    return s


def save_contact():
    """Saves a contact message to the database with server-side validation."""
    current_app.logger.info("Request received for POST /api/contact")
    try:
        data = request.get_json() or {}
        name = _sanitize(data.get('name') or '')
        email = _sanitize(data.get('email') or '')
        message = _sanitize(data.get('message') or '')

        # required fields
        if not name or not email or not message:
            return jsonify({"error": "Name, email, and message are required"}), 400

        # length limits
        if len(name) > 200 or len(email) > 200 or len(message) > 2000:
            return jsonify({"error": "One or more fields exceed allowed length"}), 400

        # basic email validation
        if not EMAIL_RE.match(email):
            return jsonify({"error": "Invalid email address"}), 400

        # Using SQLAlchemy ORM ensures parameterized queries; insert sanitized values
        new_contact = Contact(name=name, email=email, message=message)
        db.session.add(new_contact)
        db.session.commit()
        current_app.logger.info("Contact saved to database")
        return jsonify({"message": "Contact saved"}), 201
    except Exception as e:
        current_app.logger.error(f"Error saving contact: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({"error": "Failed to save contact"}), 500
