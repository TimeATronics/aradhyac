from flask import Flask, request, jsonify, session, make_response
from dotenv import load_dotenv
import os
import logging
from datetime import timedelta
from models import db
from routes import message_bp, blog_bp, contact_bp
from flask_cors import CORS

load_dotenv()

app = Flask(__name__)

# Secret key for server-side sessions (set via .env in production)
app.secret_key = os.getenv('SECRET_KEY', 'dev-secret-change-me')

# Configure session settings for persistent login
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)  # Sessions last 7 days
app.config['SESSION_COOKIE_SECURE'] = True  # Only send over HTTPS in production
app.config['SESSION_COOKIE_HTTPONLY'] = True  # Prevent XSS attacks
app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Allow cross-origin cookies

# Configure CORS to allow credentialed requests from the frontend origin
FRONTEND_ORIGIN = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')

# Support both www and non-www versions
if FRONTEND_ORIGIN == 'aradhyac.com':
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ['https://aradhyac.com', 'https://www.aradhyac.com']}})
else:
    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": FRONTEND_ORIGIN}})

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Note: Flask-Mail removed — contact messages are stored in DB only.

db.init_app(app)
with app.app_context():
    db.create_all()

# register existing blueprints (message, blog, contact)
from routes import message_bp, blog_bp, contact_bp
app.register_blueprint(message_bp)
app.register_blueprint(blog_bp)
app.register_blueprint(contact_bp)

# register projects blueprint
from routes import projects_bp
app.register_blueprint(projects_bp)

# register admin and media blueprints (moved from app.py into routes/controllers)
from routes import admin_bp, media_bp
app.register_blueprint(admin_bp)
app.register_blueprint(media_bp)

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)