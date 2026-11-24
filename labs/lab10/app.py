import json
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_from_directory
from sqlalchemy.exc import IntegrityError

from ai_service import (
    GitSessionNotFoundError,
    ModelRefusalError,
    ProviderUnavailableError,
    create_github_draft,
    extract_project_details,
    get_github_draft,
    refine_github_draft,
)
from github_service import (
    GitHubServiceError,
    RepositoryNotFoundError,
    fetch_readme,
)
from models import Author, Project, db

app = Flask(__name__)
base_dir = Path(__file__).resolve().parent
instance_dir = base_dir / "instance"
instance_dir.mkdir(exist_ok=True)

app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///" + str(instance_dir / "portfolio.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)
SEED_FILE = base_dir / "projects_seed.json"


def normalize_description(description):
    cleaned = (description or "").strip()
    if not cleaned:
        return ""
    suffix = " by Charles Avery"
    if cleaned.endswith(suffix):
        return cleaned[: -len(suffix)].rstrip()
    return cleaned


def init_seed_data():
    if Author.query.first() is None:
        author = Author(name="Charles Avery")
        db.session.add(author)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            raise

    author = Author.query.first()

    if Project.query.first() is not None:
        for project in Project.query.all():
            project.description = normalize_description(project.description)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
        return

    with SEED_FILE.open("r", encoding="utf-8") as seed_file:
        seed_projects = json.load(seed_file)

    for project_data in seed_projects:
        project = Project(
            id=project_data.get("id"),
            title=project_data["title"],
            description=normalize_description(project_data.get("description", "")),
            likes=project_data.get("likes", 0),
            author_id=author.id,
        )
        db.session.add(project)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise


def ensure_project_schema():
    with db.engine.begin() as connection:
        columns = {
            row[1]
            for row in connection.exec_driver_sql("PRAGMA table_info(projects)").fetchall()
        }
        if "difficulty" not in columns:
            connection.exec_driver_sql(
                "ALTER TABLE projects "
                "ADD COLUMN difficulty VARCHAR(20) NOT NULL DEFAULT 'Beginner'"
            )


@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(Path(app.static_folder) / "assets", filename)


@app.route("/")
def index():
    projects_db = Project.query.order_by(Project.id).all()
    return render_template("index.html", projects_db=projects_db)


@app.route("/api/projects", methods=["GET", "POST"])
def projects_collection():
    if request.method == "GET":
        projects = Project.query.order_by(Project.id).all()
        return jsonify([project.to_dict() for project in projects])

    data = request.get_json(silent=True) or {}
    title = data.get("title")

    if not isinstance(title, str) or not title.strip():
        return jsonify({"error": "Title is required"}), 400

    author = Author.query.first()
    if author is None:
        author = Author(name="Charles Avery")
        db.session.add(author)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return jsonify({"error": "Failed to create author"}), 400

    max_id = db.session.query(db.func.max(Project.id)).scalar() or 0
    new_project = Project(
        id=max_id + 1,
        title=title.strip(),
        description="",
        summary="",
        technologies="",
        likes=0,
        author_id=author.id,
    )
    db.session.add(new_project)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Project already exists"}), 400

    return jsonify(new_project.to_dict()), 201


@app.route("/api/projects/smart", methods=["POST"])
def smart_create_project():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Notes are required"}), 400

    notes = data.get("notes")

    if not isinstance(notes, str) or len(notes.strip()) < 20:
        return jsonify({"error": "Notes must be at least 20 characters"}), 400

    try:
        details = extract_project_details(notes.strip())
    except ModelRefusalError as error:
        return jsonify({"error": str(error)}), 422
    except ProviderUnavailableError as error:
        return jsonify({"error": str(error)}), 503

    title = details.title.strip()
    summary = details.summary.strip()
    technologies = ", ".join(
        technology.strip() for technology in details.technologies if technology.strip()
    )
    if not title or not summary:
        return jsonify({"error": "The AI provider returned incomplete project details"}), 503

    author = Author.query.first()
    if author is None:
        return jsonify({"error": "No project author is available"}), 503

    max_id = db.session.query(db.func.max(Project.id)).scalar() or 0
    project = Project(
        id=max_id + 1,
        title=title,
        description="",
        summary=summary,
        technologies=technologies,
        likes=0,
        author_id=author.id,
    )
    db.session.add(project)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A project with that title already exists"}), 400

    return jsonify(project.to_dict()), 201


@app.route("/api/projects/git-start", methods=["POST"])
def start_github_import():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Repository owner and name are required"}), 400

    owner = data.get("owner")
    repo = data.get("repo")
    if (
        not isinstance(owner, str)
        or not owner.strip()
        or not isinstance(repo, str)
        or not repo.strip()
    ):
        return jsonify({"error": "Repository owner and name are required"}), 400

    try:
        readme = fetch_readme(owner.strip(), repo.strip())
    except RepositoryNotFoundError as error:
        return jsonify({"error": str(error)}), 404
    except GitHubServiceError as error:
        return jsonify({"error": str(error)}), 503

    if len(readme.strip()) < 20:
        return jsonify({"error": "The repository README must be at least 20 characters"}), 400

    try:
        session_id, draft = create_github_draft(readme)
    except ModelRefusalError as error:
        return jsonify({"error": str(error)}), 422
    except ProviderUnavailableError as error:
        return jsonify({"error": str(error)}), 503

    return jsonify({"session_id": session_id, "draft": draft}), 201


@app.route("/api/projects/git-refine", methods=["POST"])
def refine_github_import():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Session ID and feedback are required"}), 400

    session_id = data.get("session_id")
    feedback = data.get("feedback")
    if not isinstance(session_id, str) or not isinstance(feedback, str):
        return jsonify({"error": "Session ID and feedback are required"}), 400

    try:
        draft = refine_github_draft(session_id, feedback.strip())
    except GitSessionNotFoundError:
        return jsonify({"error": "Draft session not found"}), 404
    except ModelRefusalError as error:
        return jsonify({"error": str(error)}), 422
    except ProviderUnavailableError as error:
        return jsonify({"error": str(error)}), 503

    return jsonify(draft), 200


@app.route("/api/projects/git-commit", methods=["POST"])
def commit_github_import():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Session ID is required"}), 400

    session_id = data.get("session_id")
    if not isinstance(session_id, str):
        return jsonify({"error": "Session ID is required"}), 400

    try:
        draft = get_github_draft(session_id)
    except GitSessionNotFoundError:
        return jsonify({"error": "Draft session not found"}), 404

    author = Author.query.first()
    if author is None:
        return jsonify({"error": "No project author is available"}), 503

    max_id = db.session.query(db.func.max(Project.id)).scalar() or 0
    project = Project(
        id=max_id + 1,
        title=draft["title"],
        description="",
        summary=draft["summary"],
        technologies=", ".join(draft["technologies"]),
        difficulty=draft["difficulty"],
        likes=0,
        author_id=author.id,
    )
    db.session.add(project)

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "A project with that title already exists"}), 400

    return jsonify(project.to_dict()), 201


@app.route("/api/projects/<int:project_id>/upvote", methods=["POST"])
def upvote_project(project_id):
    project = Project.query.filter_by(id=project_id).first()

    if project is None:
        return jsonify({"error": "Project not found"}), 404

    project.likes += 1

    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify({"error": "Could not update project"}), 400

    return jsonify({"id": project.id, "likes": project.likes})


with app.app_context():
    db.create_all()
    ensure_project_schema()
    init_seed_data()


if __name__ == "__main__":
    app.run(debug=True)
