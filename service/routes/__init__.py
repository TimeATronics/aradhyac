from flask import Blueprint

message_bp = Blueprint('message', __name__)
blog_bp = Blueprint('blog', __name__)
contact_bp = Blueprint('contact', __name__)
projects_bp = Blueprint('projects', __name__)
admin_bp = Blueprint('admin', __name__)
media_bp = Blueprint('media', __name__)

from . import message_routes
from . import blog_routes
from . import contact_routes
from . import projects_routes
from . import admin_routes
from . import media_routes

# Expose blueprints for app registration
__all__ = ['message_bp', 'blog_bp', 'contact_bp', 'projects_bp', 'admin_bp', 'media_bp']

# Note: project routes live in projects_bp.py; import that module where needed
# to avoid circular import issues (app.py imports routes.projects_bp explicitly).
