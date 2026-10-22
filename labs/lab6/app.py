from flask import Flask, render_template

app = Flask(__name__, static_url_path="")

projects_db = [
    {
        "id": 1,
        "title": "History Trivia",
        "description": "Infinite version of the web game Chronogram.",
        "likes": 42,
    },
    {
        "id": 2,
        "title": "BoxClock",
        "description": "A clock that displays the time remaining in a Clarkstown High School North class period",
        "likes": 0,
    }
]


@app.route("/")
def index():
    return render_template("index.html", projects_db=projects_db)


if __name__ == "__main__":
    app.run(debug=True)
