from flask import current_app, jsonify, request
from models.project import Project
from models import db
import requests
from sqlalchemy import desc

def list_projects():
    current_app.logger.info('Request received for /api/projects')
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 4))
        base = Project.query
        total = base.count()
        items = base.order_by(Project.github_updated_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return jsonify({'items': [p.to_json() for p in items], 'total': total, 'page': page, 'per_page': per_page})
    except Exception as e:
        current_app.logger.error(f"Error listing projects: {e}")
        return jsonify({'error': 'Could not list projects'}), 500


def refresh_projects():
    current_app.logger.info('Refreshing projects from GitHub')
    try:
        gh_url = 'https://api.github.com/users/TimeATronics/repos'
        r = requests.get(gh_url, timeout=10)
        r.raise_for_status()
        data = r.json()
        updated = 0
        created = 0
        for item in data:
            full_name = item.get('full_name') or item.get('name')
            description = item.get('description')
            html_url = item.get('html_url')
            updated_at = item.get('updated_at')
            parsed_time = Project.parse_github_time(updated_at) if updated_at else None
            if not full_name or not html_url:
                continue
            existing = Project.query.filter_by(full_name=full_name).first()
            if existing:
                changed = False
                if existing.description != description:
                    existing.description = description
                    changed = True
                if parsed_time and existing.github_updated_at != parsed_time:
                    existing.github_updated_at = parsed_time
                    changed = True
                if changed:
                    db.session.add(existing)
                    updated += 1
            else:
                p = Project(full_name=full_name, description=description, html_url=html_url, github_updated_at=parsed_time)
                db.session.add(p)
                created += 1
        db.session.commit()
        return jsonify({'success': True, 'updated': updated, 'created': created})
    except Exception as e:
        current_app.logger.error(f"Error refreshing projects from Github: {e}")
        return jsonify({'error': 'Failed to refresh projects'}), 500
