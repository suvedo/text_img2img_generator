from werkzeug.security import generate_password_hash, check_password_hash

from database.db_model import db

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(120), primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def set_email(self, email):
        self.email = email