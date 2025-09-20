from . import db

class S3Asset(db.Model):
    __tablename__ = 's3_assets'
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String(255), nullable=False)
    file_type = db.Column(db.String(100), nullable=False)

    def to_json(self):
        return { 'id': self.id, 'file_name': self.file_name, 'file_type': self.file_type }
