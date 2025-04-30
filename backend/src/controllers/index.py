from flask import request, jsonify
from models.index import Index


def query():
    data = request.get_json()
    query = data.get("message", "")
    result = Index.query_index(query=query)
    return jsonify({"reply": result["reply"], "answer": result["result"]})


def add_file():
    file = request.files.get("file")
    tokens = int(request.form.get("tokens", 0))
    if tokens <= 99:
        return "", 400

    info = Index.add_file(file=file, chunk_size=tokens)
    return (
        jsonify(
            {
                "fileId": info["fileId"],
                "originalName": info["original_name"],
            }
        ),
        200,
    )


def remove_file():
    file_id = request.get_json().get("fileId")
    Index.remove_file(file_id=file_id)
    return "", 200


def get_data():
    docs = Index.get_data()
    return jsonify({"documents": docs})
