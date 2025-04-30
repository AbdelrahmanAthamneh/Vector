from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
from controllers.index import add_file, get_data, remove_file, query
import os

load_dotenv()

app = Flask(__name__)
CORS(app)


app.route("/add-file", methods=["POST"])(add_file)
app.route("/remove-file", methods=["DELETE"])(remove_file)
app.route("/get-data", methods=["GET"])(get_data)
app.route("/message", methods=["POST"])(query)

PORT = os.getenv("PORT") or 5001
app.run(port=PORT, debug=True)
