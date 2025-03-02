// components/TranscriptUploader.js
import React, { useState } from "react";
import axios from "axios";

const TranscriptUploader = ({ setReport }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post("/api/moderate-transcript", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setReport(response.data);
    } catch (err) {
      setError("Error uploading the file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" accept=".txt" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={loading}>
        {loading ? "Uploading..." : "Upload Transcript"}
      </button>
      {error && <p>{error}</p>}
    </div>
  );
};

export default TranscriptUploader;
