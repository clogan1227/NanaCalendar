import React, { useState } from 'react'; // Import useState
import { db, storage } from './firebase'; // Import Firebase storage instance
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase storage functions
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"; // Firestore functions
import { v4 as uuidv4 } from 'uuid'; // Unique file names
import EXIF from 'exif-js'; // Extracting metadata from photos

import './App.css';
import PhotoDisplay from './components/PhotoDisplay/PhotoDisplay';
import CalendarView from './components/CalendarView/CalendarView';

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [photoExifData, setPhotoExifData] = useState(null);

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setUploadMessage(""); // Clear previous messages
      setPhotoExifData(null); // Reset previous EXIF data

      EXIF.getData(file, function() {
        const allMetaData = EXIF.getAllTags(this);
        // console.log("All EXIF Data:", allMetaData); // For debugging

        // 'DateTimeOriginal' is the standard tag for date taken
        const dateTaken = allMetaData.DateTimeOriginal || allMetaData.DateTime;
        const cameraMake = allMetaData.Make;
        const cameraModel = allMetaData.Model;

        if (dateTaken) {
          const [datePart, timePart] = dateTaken.split(" ");
          const [year, month, day] = datePart.split(":");
          const [hour, minute, second] = timePart.split(":");
          const jsDate = new Date(year, month - 1, day, hour, minute, second);

          setPhotoExifData({
            dateTaken: Timestamp.fromDate(jsDate), // Convert to Firestore Timestamp
            cameraMake: cameraMake || null,
            cameraModel: cameraModel || null,
          });
        } else {
          console.log("Date Taken not found in EXIF data.");
          setPhotoExifData({ dateTaken: null, cameraMake: null, cameraModel: null });
        }
      });
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

      const photoDataToSave = {
        imageUrl: downloadURL,
        fileName: selectedFile.name, // Store original filename for reference if needed
        createdAt: serverTimestamp(), // This is "Date Uploaded". Automatically adds a server-side timestamp

        // --- ADD EXIF DATA TO FIRESTORE DOCUMENT ---
        dateTaken: photoExifData?.dateTaken || null, // Use null if not found
        cameraMake: photoExifData?.cameraMake || null,
        cameraModel: photoExifData?.cameraModel || null,
      };

      const photosCollectionRef = collection(db, "photos");
      await addDoc(photosCollectionRef, photoDataToSave);

      setUploadMessage(`Upload successful! File is at: ${downloadURL.substring(0, 50)}...`); // Show partial URL
      setSelectedFile(null); // Reset file input
      setPhotoExifData(null);

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
      <CalendarView />
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