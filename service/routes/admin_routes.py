from . import admin_bp
from flask import jsonify, request, session, current_app
from controllers.admin import get_contacts
import os

@admin_bp.route('/api/admin/login', methods=['POST'])
def admin_login():
    """Admin login endpoint with session management"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password required'}), 400
        
        # Check credentials against environment variables
        admin_user = os.getenv('ADMIN_USER')
        admin_pass = os.getenv('ADMIN_PASS')
        
        if username == admin_user and password == admin_pass:
            # Set session to remember login
            session['admin_authenticated'] = True
            session['admin_user'] = username
            session.permanent = True  # Make session persistent
            
            current_app.logger.info(f"Admin user {username} logged in successfully")
            return jsonify({'success': True, 'message': 'Login successful'})
        else:
            current_app.logger.warning(f"Failed login attempt for user: {username}")
            return jsonify({'error': 'Invalid username or password'}), 401
            
    except Exception as e:
        current_app.logger.error(f"Error during admin login: {e}")
        return jsonify({'error': 'Login failed'}), 500

@admin_bp.route('/api/admin/logout', methods=['POST'])
def admin_logout():
    """Admin logout endpoint"""
    try:
        session.pop('admin_authenticated', None)
        session.pop('admin_user', None)
        current_app.logger.info("Admin user logged out")
        return jsonify({'success': True, 'message': 'Logout successful'})
    except Exception as e:
        current_app.logger.error(f"Error during admin logout: {e}")
        return jsonify({'error': 'Logout failed'}), 500

@admin_bp.route('/api/admin/check-auth', methods=['GET'])
def check_admin_auth():
    """Check if admin is currently authenticated"""
    is_authenticated = session.get('admin_authenticated', False)
    if is_authenticated:
        return jsonify({'authenticated': True, 'user': session.get('admin_user')})
    else:
        return jsonify({'authenticated': False})

@admin_bp.route('/api/admin/contacts', methods=['GET'])
def admin_get_contacts():
    return get_contacts()
