import React, { useState } from 'react'; // Import useState
import { db, storage } from './firebase'; // Import Firebase storage instance
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase storage functions
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Firestore functions
import { v4 as uuidv4 } from 'uuid'; // Unique file names

import './App.css';
import PhotoDisplay from './components/PhotoDisplay/PhotoDisplay';
// import CalendarView from './components/CalendarView/CalendarView';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      setUploadMessage(""); // Clear previous messages
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadMessage("Please select a file first.");
      return;
    }

    setIsUploading(true);
    setUploadMessage("Uploading...");

    // Create a unique file name using uuid to prevent overwrites
    const fileName = `images/${uuidv4()}-${selectedFile.name}`;
    const storageRef = ref(storage, fileName);

    try {
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);

      console.log('File available at', downloadURL);

      const photosCollectionRef = collection(db, "photos");
      await addDoc(photosCollectionRef, {
        imageUrl: downloadURL,
        fileName: selectedFile.name, // Store original filename for reference if needed
        createdAt: serverTimestamp() // Automatically adds a server-side timestamp
      });

      setUploadMessage(`Upload successful! File is at: ${downloadURL.substring(0, 50)}...`); // Show partial URL
      setSelectedFile(null); // Reset file input

      if (document.querySelector('input[type="file"]')) {
        document.querySelector('input[type="file"]').value = "";
      }
    } catch (error) {
      console.error("Error uploading file or saving to Firestore:", error);
      setUploadMessage(`Upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="app-container">
      <PhotoDisplay />
      {/* <CalendarView /> */}
      <div className="photo-uploader">
        <h3>Upload New Photo</h3>
        <input type="file" onChange={handleFileChange} accept="image/*" />
        <button onClick={handleUpload} disabled={!selectedFile || isUploading}>
          {isUploading ? "Uploading..." : "Upload Photo"}
        </button>
        {uploadMessage && <p>{uploadMessage}</p>}
      </div>
    </div>
  );
}

export default App;