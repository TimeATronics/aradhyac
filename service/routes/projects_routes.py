from . import projects_bp
from controllers.projects import list_projects, refresh_projects

@projects_bp.route('/api/projects', methods=['GET'])
def projects():
    return list_projects()

@projects_bp.route('/api/projects/refresh', methods=['POST'])
def projects_refresh():
    return refresh_projects()
