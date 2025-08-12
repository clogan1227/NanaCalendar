import React, { useState } from 'react'; // Import useState
import { db, storage } from './firebase'; // Import Firebase storage instance
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase storage functions
import { collection, addDoc, serverTimestamp, Timestamp } from "firebase/firestore"; // Firestore functions
import { v4 as uuidv4 } from 'uuid'; // Unique file names
import EXIF from 'exif-js'; // Extracting metadata from photos

import './App.css';
import PhotoDisplay from './components/PhotoDisplay/PhotoDisplay';
import CalendarView from './components/CalendarView/CalendarView';
import PhotoUploader from './components/PhotoUploader/PhotoUploader';

// Wraps the callback-based EXIF.getData in a Promise
const parseExifData = (file) => {
  return new Promise((resolve) => {
    EXIF.getData(file, function() {
      const allMetaData = EXIF.getAllTags(this);
      const dateTaken = allMetaData.DateTimeOriginal || allMetaData.DateTime;

      if (dateTaken) {
        const [datePart, timePart] = dateTaken.split(" ");
        const [year, month, day] = datePart.split(":");
        const [hour, minute, second] = timePart.split(":");
        const jsDate = new Date(year, month - 1, day, hour, minute, second);
        resolve({
          dateTaken: Timestamp.fromDate(jsDate),
          cameraMake: allMetaData.Make || null,
          cameraModel: allMetaData.Model || null,
        });
      } else {
        // Resolve with nulls if no date is found
        resolve({ dateTaken: null, cameraMake: null, cameraModel: null });
      }
    });
  });
};

function App() {
  const [isUploaderOpen, setIsUploaderOpen] = useState(false);

  const handlePhotoUpload = async (file) => {
    if (!file) {
      throw new Error("No file provided.");
    }

    // Parse EXIF data from the provided file
    const exifData = await parseExifData(file);

    // Create a unique filename and Firebase reference
    const fileName = `images/${uuidv4()}-${file.name}`;
    const storageRef = ref(storage, fileName);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    console.log('File available at', downloadURL);

    // Prepare the data object for Firestore
    const photoDataToSave = {
      imageUrl: downloadURL,
      fileName: file.name,
      createdAt: serverTimestamp(),
      dateTaken: exifData.dateTaken,
      cameraMake: exifData.cameraMake,
      cameraModel: exifData.cameraModel,
    };

    // Save the metadata to Firestore
    const photosCollectionRef = collection(db, "photos");
    await addDoc(photosCollectionRef, photoDataToSave);

    // If we reach here, the upload was successful.
    // The function implicitly returns a resolved Promise.
  };

  return (
    <div className="app-container">
      <PhotoDisplay />
      <CalendarView />
      <button
        className="floating-upload-btn"
        onClick={() => setIsUploaderOpen(true)}
        title="Upload Photo"
      >
        +
      </button>
      <PhotoUploader
        isOpen={isUploaderOpen}
        onClose={() => setIsUploaderOpen(false)}
        onUpload={handlePhotoUpload} // Pass the refactored function as a prop
      />
    </div>
  );
}

export default App;