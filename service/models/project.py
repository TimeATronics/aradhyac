from . import db
from datetime import datetime
from dateutil import parser as dateparser

class Project(db.Model):
    __tablename__ = 'projects'
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(255), nullable=False, unique=True)
    description = db.Column(db.Text, nullable=True)
    html_url = db.Column(db.String(1024), nullable=False)
    github_updated_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_json(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'description': self.description,
            'html_url': self.html_url,
            # keep the field name 'updated_at' as requested, populated from Github timestamp
            'updated_at': self.github_updated_at.isoformat() if self.github_updated_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_db_at': self.updated_at.isoformat() if self.updated_at else None
        }

    @staticmethod
    def parse_github_time(timestr: str):
        try:
            return dateparser.parse(timestr)
        except Exception:
            return None
