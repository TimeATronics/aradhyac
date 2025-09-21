from flask import current_app, jsonify, request
from models.blog import Blog
from models import db
import json
from sqlalchemy import func

def get_blogs():
    """Fetches paginated blogs. Supports page, per_page, q (search), and tag."""
    current_app.logger.info("Request received for /api/blogs")
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 4))
        query = request.args.get('q', '').strip()
        tag = request.args.get('tag', '').strip()

        base = Blog.query
        if query:
            base = base.filter((Blog.title.contains(query)) | (Blog.content.contains(query)))
        if tag:
            # exact tag matching when tags is stored as JSON array
            base = base.filter(func.json_contains(Blog.tags, json.dumps([tag])))

        total = base.count()
        items = base.order_by(Blog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return jsonify({
            'items': [blog.to_json() for blog in items],
            'total': total,
            'page': page,
            'per_page': per_page
        })
    except Exception as e:
        current_app.logger.error(f"Error fetching blogs: {e}")
        return jsonify({"error": "Failed to fetch blogs"}), 500

def get_blog(blog_id):
    """Fetches a single blog by ID."""
    current_app.logger.info(f"Request received for /api/blogs/{blog_id}")
    try:
        blog = Blog.query.get(blog_id)
        if blog:
            return jsonify(blog.to_json())
        else:
            return jsonify({"error": "Blog not found"}), 404
    except Exception as e:
        current_app.logger.error(f"Error fetching blog: {e}")
        return jsonify({"error": "Failed to fetch blog"}), 500

def create_blog():
    """Creates a new blog."""
    current_app.logger.info("Request received for POST /api/blogs")
    try:
        data = request.get_json()
        title = data.get('title')
        content = data.get('content')
        tags = data.get('tags', [])
        hero_image = data.get('hero_image')
        if isinstance(tags, str):
            # support comma separated fallback
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        author = data.get('author', 'Aradhya')
        if not title or not content:
            return jsonify({"error": "Title and content are required"}), 400
        new_blog = Blog(title=title, content=content, tags=tags, author=author, hero_image=hero_image)
        db.session.add(new_blog)
        db.session.commit()
        return jsonify(new_blog.to_json()), 201
    except Exception as e:
        current_app.logger.error(f"Error creating blog: {e}")
        return jsonify({"error": "Failed to create blog"}), 500

def update_blog(blog_id):
    """Updates an existing blog."""
    current_app.logger.info(f"Request received for PUT /api/blogs/{blog_id}")
    try:
        blog = Blog.query.get(blog_id)
        if not blog:
            return jsonify({"error": "Blog not found"}), 404
        data = request.get_json()
        blog.title = data.get('title', blog.title)
        blog.content = data.get('content', blog.content)
        tags = data.get('tags', blog.tags or [])
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]
        blog.tags = tags
        blog.author = data.get('author', blog.author)
        blog.hero_image = data.get('hero_image', blog.hero_image)
        db.session.commit()
        return jsonify(blog.to_json())
    except Exception as e:
        current_app.logger.error(f"Error updating blog: {e}")
        return jsonify({"error": "Failed to update blog"}), 500

def delete_blog(blog_id):
    """Deletes a blog."""
    current_app.logger.info(f"Request received for DELETE /api/blogs/{blog_id}")
    try:
        blog = Blog.query.get(blog_id)
        if not blog:
            return jsonify({"error": "Blog not found"}), 404
        db.session.delete(blog)
        db.session.commit()
        return jsonify({"message": "Blog deleted"})
    except Exception as e:
        current_app.logger.error(f"Error deleting blog: {e}")
        return jsonify({"error": "Failed to delete blog"}), 500

def search_blogs():
    """Searches blogs by keyword or tag with pagination."""
    current_app.logger.info("Request received for /api/blogs/search")
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 4))
        query = request.args.get('q', '').strip()
        tag = request.args.get('tag', '').strip()

        base = Blog.query
        if query:
            base = base.filter(Blog.title.contains(query) | Blog.content.contains(query))
        if tag:
            # tags are stored as JSON arrays; use JSON_CONTAINS to match an element exactly
            base = base.filter(func.json_contains(Blog.tags, json.dumps([tag])))

        total = base.count()
        items = base.order_by(Blog.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return jsonify({
            'items': [blog.to_json() for blog in items],
            'total': total,
            'page': page,
            'per_page': per_page
        })
    except Exception as e:
        current_app.logger.error(f"Error searching blogs: {e}")
        return jsonify({"error": "Failed to search blogs"}), 500
