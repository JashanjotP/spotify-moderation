// pages/index.js
import React, { useState } from "react";
import TranscriptUploader from "../components/TranscriptUploader";

const Home = () => {
  const [report, setReport] = useState(null);

  return (
    <div>
      <h1>Transcript Moderation</h1>
      <TranscriptUploader setReport={setReport} />

      {report && (
        <div>
          <h2>Moderation Report</h2>
          <pre>{JSON.stringify(report, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Home;
