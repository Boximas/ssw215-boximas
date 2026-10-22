from flask import Flask, jsonify, render_template

app = Flask(__name__, static_url_path="")

projects_db = [
    {
        "id": 1,
        "title": "Chronogram",
        "description": "Infinite version of the web game Chronogram.",
        "likes": 42,
    },
    {
        "id": 2,
        "title": "BoxClock",
        "description": "A clock that displays the time remaining in a Clarkstown High School North class period.",
        "likes": 0,
    },
    {
        "id": 3,
        "title": "History Trivia",
        "description": "A history-themed trivia challenge with an endless mode.",
        "likes": 12,
    },
]


@app.route("/")
def index():
    return render_template("index.html", projects_db=projects_db)


@app.route("/api/projects/<int:project_id>/upvote", methods=["POST"])
def upvote_project(project_id):
    for project in projects_db:
        if project["id"] == project_id:
            project["likes"] += 1
            return jsonify({"id": project["id"], "likes": project["likes"]})

    return jsonify({"error": "Project not found"}), 404


if __name__ == "__main__":
    app.run(debug=True)
