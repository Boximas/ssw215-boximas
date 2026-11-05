import json
from pathlib import Path

from flask import Flask, jsonify, render_template, request, send_from_directory

app = Flask(__name__)
PROJECTS_FILE = Path(__file__).resolve().with_name("projects.json")


def load_projects():
    with PROJECTS_FILE.open(encoding="utf-8") as projects_file:
        return json.load(projects_file)


def save_projects(projects_db):
    with PROJECTS_FILE.open("w", encoding="utf-8") as projects_file:
        json.dump(projects_db, projects_file, indent=2)
        projects_file.write("\n")


@app.route("/assets/<path:filename>")
def assets(filename):
    return send_from_directory(Path(app.static_folder) / "assets", filename)


@app.route("/")
def index():
    return render_template("index.html", projects_db=load_projects())


@app.route("/api/projects", methods=["POST"])
def create_project():
    data = request.get_json(silent=True) or {}
    title = data.get("title")

    if not isinstance(title, str) or not title.strip():
        return jsonify({"error": "Title is required"}), 400

    projects_db = load_projects()
    next_id = max((project["id"] for project in projects_db), default=0) + 1
    new_project = {
        "id": next_id,
        "title": str(title).strip(),
        "description": "",
        "likes": 0,
    }
    projects_db.append(new_project)
    save_projects(projects_db)
    return jsonify(new_project), 201


@app.route("/api/projects/<int:project_id>/upvote", methods=["POST"])
def upvote_project(project_id):
    projects_db = load_projects()
    for project in projects_db:
        if project["id"] == project_id:
            project["likes"] += 1
            save_projects(projects_db)
            return jsonify({"id": project["id"], "likes": project["likes"]})

    return jsonify({"error": "Project not found"}), 404


if __name__ == "__main__":
    app.run(debug=True)
