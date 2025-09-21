from . import admin_bp
from flask import jsonify, request, session, current_app
from controllers.admin import get_contacts

@admin_bp.route('/api/admin/contacts', methods=['GET'])
def admin_get_contacts():
    return get_contacts()
