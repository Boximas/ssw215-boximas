from flask_sqlalchemy import SQLAlchemy


db = SQLAlchemy()


class Author(db.Model):
    __tablename__ = "authors"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    projects = db.relationship("Project", backref="author", lazy=True)


class Project(db.Model):
    __tablename__ = "projects"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(120), nullable=False, unique=True)
    description = db.Column(db.String(255), nullable=False, default="")
    likes = db.Column(db.Integer, default=0, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey("authors.id"), nullable=False)

    def to_dict(self):
        author_name = self.author.name if self.author else None
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "likes": self.likes,
            "author_id": self.author_id,
            "author": author_name,
        }
