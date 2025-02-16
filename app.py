from flask import Flask #pip install flask

app = Flask(__name__)

@app.route("/")
def start_page():
    return "<p>Start Page</p>"