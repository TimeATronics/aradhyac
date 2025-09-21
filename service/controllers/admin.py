from flask import current_app, jsonify, session, request
from models.contact import Contact


def get_contacts():
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        # pagination parameters
        try:
            page = int(request.args.get('page', '1'))
        except ValueError:
            page = 1
        try:
            per_page = int(request.args.get('per_page', '10'))
        except ValueError:
            per_page = 10
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 10

        query = Contact.query.order_by(Contact.created_at.desc())
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return jsonify({'contacts': [c.to_json() for c in items], 'total': total})
    except Exception as e:
        current_app.logger.error(f"Error fetching contacts: {e}")
        return jsonify({'error': 'Could not fetch contacts'}), 500
