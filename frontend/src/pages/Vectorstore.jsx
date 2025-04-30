"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, FileText, Plus, Loader } from "lucide-react";
import { useLoaderData, useNavigate } from "react-router-dom";
import Navigation from "../components/Navigation/Navigation";
import classes from "./Vectorstore.module.css";

export default function VectorstorePage() {
  const initialDocuments = useLoaderData();
  const [documents, setDocuments] = useState(initialDocuments || []);
  const [chunkSize, setChunkSize] = useState("500");
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const navigate = useNavigate();

  const handleChunkSizeChange = (e) => {
    setChunkSize(e.target.value);
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch("http://localhost:5002/get-data");
      if (!response.ok) {
        throw new Error("Failed getting docs!");
      }
      const data = await response.json();
      setDocuments(data.documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    }
  };

  const uploadFile = async (file) => {
    if (!file || !chunkSize) {
      alert("Please select a file and enter a chunk size.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("tokens", +chunkSize);

    try {
      const response = await fetch("http://localhost:5002/add-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("File upload failed");
      }

      alert("File uploaded successfully!");
      // Instead of reloading, fetch the updated documents
      await fetchDocuments();
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Error uploading file");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      uploadFile(selectedFile);
    }
  };

  const deleteFile = async (fileId) => {
    setIsDeleting(fileId);
    try {
      const response = await fetch(`http://localhost:5002/remove-file`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      alert("File deleted successfully!");
      // Instead of reloading, update the state directly
      setDocuments(documents.filter((doc) => doc.fileInfo.fileId !== fileId));
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file");
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <motion.main
      className={classes["main-container"]}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Navigation currentPage="Vectorstore" />
      <motion.div
        className={classes["table-head"]}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <h2>Documents</h2>
        <div className={classes.controls}>
          <div className={classes.chunkSizeControl}>
            <label htmlFor="chunkSize">Chunk Size:</label>
            <input
              id="chunkSize"
              type="text"
              value={chunkSize}
              onChange={handleChunkSizeChange}
            />
          </div>
          <motion.label
            className={classes["upload-button"]}
            htmlFor="upload"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUploading ? (
              <>
                <Loader size={20} className={classes.spinIcon} />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload size={20} />
                <span>Upload</span>
              </>
            )}
            <input
              type="file"
              style={{ display: "none" }}
              name="upload"
              id="upload"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </motion.label>
        </div>
      </motion.div>

      <div className={classes["document-container"]}>
        {documents.length === 0 ? (
          <motion.div
            className={classes.emptyState}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FileText size={48} className={classes.emptyIcon} />
            <p>No documents yet</p>
            <p className={classes.emptySubtext}>
              Upload your first document to get started
            </p>
            <motion.label
              className={classes.emptyUploadBtn}
              htmlFor="upload-empty"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus size={16} />
              <span>Add Document</span>
              <input
                type="file"
                style={{ display: "none" }}
                name="upload-empty"
                id="upload-empty"
                onChange={handleFileChange}
              />
            </motion.label>
          </motion.div>
        ) : (
          <div className={classes.documentsScroll}>
            <AnimatePresence>
              {documents.map((document, index) => {
                const fileInfo = document.fileInfo;
                const count = index + 1;
                return (
                  <motion.div
                    className={classes.document}
                    key={fileInfo.fileId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.05, duration: 0.3 }}
                  >
                    <div className={classes.documentInfo}>
                      <div className={classes.documentIcon}>
                        <FileText size={20} />
                      </div>
                      <div className={classes.documentDetails}>
                        <p className={classes.documentName}>
                          <span className={classes.documentNumber}>
                            {count}.
                          </span>{" "}
                          {fileInfo.filename}
                        </p>
                      </div>
                    </div>
                    <motion.button
                      className={classes.deleteButton}
                      onClick={() => deleteFile(fileInfo.fileId)}
                      disabled={isDeleting === fileInfo.fileId}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {isDeleting === fileInfo.fileId ? (
                        <Loader size={20} className={classes.spinIcon} />
                      ) : (
                        <Trash2 size={20} />
                      )}
                    </motion.button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.main>
  );
}

export async function loader() {
  try {
    const response = await fetch("http://localhost:5002/get-data");
    if (!response.ok) {
      throw new Error("Failed getting docs!");
    }
    const data = await response.json();
    console.log(data);
    return data.documents;
  } catch (error) {
    console.error("Error loading documents:", error);
    return [];
  }
}
