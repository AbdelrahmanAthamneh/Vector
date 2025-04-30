import faiss
from bson.binary import Binary
import numpy as np


def save_index(index_collection, index):
    index_data = faiss.serialize_index(index)
    index_collection.update_one(
        {"_id": "faiss_index"},
        {"$set": {"index_data": Binary(index_data)}},
        upsert=True,
    )


def load_index(index_collection, embedding_dim):
    index_data = index_collection.find_one({"_id": "faiss_index"})
    if index_data:
        index = faiss.deserialize_index(
            np.frombuffer(index_data["index_data"], dtype=np.uint8)
        )
    else:
        index = faiss.IndexIDMap(faiss.IndexFlatL2(embedding_dim))
    return index
