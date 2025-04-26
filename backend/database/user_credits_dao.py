from werkzeug.security import generate_password_hash, check_password_hash

from database.db_model import db

class UserCredits(db.Model):
    __tablename__ = 'user_credis'

    user_id = db.Column(db.String(120), primary_key=True)
    credit_type = db.Column(db.String(120), nullable=False)
    credit_count = db.Column(db.String(120), nullable=False)