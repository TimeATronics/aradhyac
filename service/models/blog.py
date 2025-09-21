from . import db
from datetime import datetime

class Blog(db.Model):
    __tablename__ = 'blogs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    # store tags as JSON array for exact matching
    tags = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    author = db.Column(db.String(100), default='Aradhya')
    # hero image path (S3 key or full URL)
    hero_image = db.Column(db.String(512), nullable=True)

    def to_json(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'tags': (self.tags or []),
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'author': self.author,
            'hero_image': self.hero_image
        }

# SQL migration note (execute once in DB):
# ALTER TABLE blogs ADD COLUMN hero_image VARCHAR(512)
