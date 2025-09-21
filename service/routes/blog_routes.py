from . import blog_bp
from controllers.blog import get_blogs, get_blog, create_blog, update_blog, delete_blog, search_blogs

@blog_bp.route("/api/blogs", methods=["GET"])
def blogs():
    return get_blogs()

@blog_bp.route("/api/blogs/<int:blog_id>", methods=["GET"])
def blog(blog_id):
    return get_blog(blog_id)

@blog_bp.route("/api/blogs", methods=["POST"])
def create():
    return create_blog()

@blog_bp.route("/api/blogs/<int:blog_id>", methods=["PUT"])
def update(blog_id):
    return update_blog(blog_id)

@blog_bp.route("/api/blogs/<int:blog_id>", methods=["DELETE"])
def delete(blog_id):
    return delete_blog(blog_id)

@blog_bp.route("/api/blogs/search", methods=["GET"])
def search():
    return search_blogs()
