from datetime import datetime
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from utils.faiss import load_index, save_index
from utils.text import extract_text
import numpy as np
import uuid
import os
from time import sleep
from openai import OpenAI
import base64


client = MongoClient(os.getenv("MONGO_STRING"))
db = client["vector-database"]
files_collection = db["files"]
index_collection = db["index"]


model = SentenceTransformer("all-MiniLM-L6-v2")
embedding_dim = model.get_sentence_embedding_dimension()
index = load_index(index_collection, embedding_dim)


class Index:

    @staticmethod
    def query_index(query, top_k=5):
        query_embedding = model.encode([query], convert_to_numpy=True)
        distances, vector_ids = index.search(query_embedding, top_k)
        vector_ids = vector_ids[0].tolist()

        matches = []
        results = files_collection.find({"chunks.vectorId": {"$in": vector_ids}})
        for doc in results:
            for chunk in doc["chunks"]:
                if chunk["vectorId"] in vector_ids:
                    idx = vector_ids.index(chunk["vectorId"])
                    matches.append(
                        {
                            "text": chunk["text"],
                            "vectorId": chunk["vectorId"],
                            "distance": float(distances[0][idx]),
                        }
                    )

        output = ""
        for i, m in enumerate(matches[:3], start=1):
            label = ["Top", "Second", "Third"][i - 1]
            output += (
                f"{label} result:\nText: {m['text']}\nDistance: {m['distance']}\n\n"
            )
        output_with_query = output + query

        client = OpenAI(api_key=os.getenv("OPENAI_KEY"))
        assistant = client.beta.assistants.retrieve(os.getenv("ASSISTANT_ID"))
        thread = client.beta.threads.create()
        client.beta.threads.messages.create(
            thread_id=thread.id, role="user", content=output_with_query
        )
        run = client.beta.threads.runs.create(
            thread_id=thread.id, assistant_id=assistant.id
        )

        while True:
            sleep(1)
            r = client.beta.threads.runs.retrieve(run_id=run.id, thread_id=thread.id)
            if r.status == "completed":
                break

        reply_msg = client.beta.threads.messages.list(thread_id=thread.id)
        return {"reply": reply_msg.data[0].content[0].text.value, "result": output}

    @staticmethod
    def add_file(file, chunk_size=500):
        try:
            file_content = file.read()
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            modified_filename = f"{timestamp}_{file.filename}"

            sentences = extract_text(file_content, file.filename, chunk_size)
            embeddings = model.encode(sentences, convert_to_numpy=True)
            vector_ids = np.array(
                [uuid.uuid4().int & (2**63 - 1) for _ in sentences], dtype="uint64"
            )

            index.add_with_ids(embeddings, vector_ids)
            save_index(index_collection, index)

            encoded_content = base64.b64encode(file_content).decode("utf-8")

            files_collection.insert_one(
                {
                    "fileInfo": {
                        "fileId": modified_filename,
                        "filename": file.filename,
                        "content": encoded_content,
                        "mimeType": file.content_type,
                    },
                    "chunks": [
                        {"text": s, "vectorId": int(v)}
                        for s, v in zip(sentences, vector_ids.tolist())
                    ],
                    "vectorIds": vector_ids.tolist(),
                    "indexedAt": datetime.now(),
                }
            )

        finally:
            if hasattr(file, "seek"):
                file.seek(0)

        return {"original_name": file.filename, "fileId": modified_filename}

    @staticmethod
    def remove_file(file_id):
        doc = files_collection.find_one_and_delete({"fileInfo.fileId": file_id})
        if not doc:
            return {"error": "File not found."}

        ids = np.array(doc["vectorIds"], dtype="uint64")
        index.remove_ids(ids)
        save_index(index_collection, index)

    @staticmethod
    def get_data():
        cursor = files_collection.find(
            {},
            {
                "_id": 0,
                "fileInfo.filename": 1,
                "fileInfo.fileId": 1,
                "fileInfo.mimeType": 1,
            },
        )
        return list(cursor)

    @staticmethod
    def get_file(file_id):
        doc = files_collection.find_one(
            {"fileInfo.fileId": file_id},
            {"_id": 0, "fileInfo.content": 1, "fileInfo.mimeType": 1},
        )
        if not doc:
            return None

        return {
            "content": base64.b64decode(doc["fileInfo"]["content"]),
            "mimeType": doc["fileInfo"]["mimeType"],
        }
