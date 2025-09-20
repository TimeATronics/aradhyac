from . import db

class TestMessage(db.Model):
    __tablename__ = 'test'
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.Text, nullable=False)

    def to_json(self):
        return { 'id': self.id, 'message': self.message }
