import React, { useState } from 'react'; // Import useState
import { db, storage } from './firebase'; // Import Firebase storage instance
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"; // Firebase storage functions
import { collection, addDoc, serverTimestamp, Timestamp, doc, deleteDoc } from "firebase/firestore"; // Firestore functions
import { v4 as uuidv4 } from 'uuid'; // Unique file names
import EXIF from 'exif-js'; // Extracting metadata from photos

import './App.css';
import PhotoDisplay from './components/PhotoDisplay/PhotoDisplay';
import CalendarView from './components/CalendarView/CalendarView';
import MainMenu from './components/MainMenu/MainMenu';
// import PhotoManager from './components/PhotoManager/PhotoManager';
import ManualEventCreator from './components/ManualEventCreator/ManualEventCreator';

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
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  const [isPhotoPageOpen, setIsPhotoPageOpen] = useState(false);
  const [isAddEventPageOpen, setIsAddEventPageOpen] = useState(false);

  const handleMultipleUploads = async (files) => {
    console.log(`Uploading ${files.length} files...`);
    const uploadPromises = files.map(async (file) => {
      try {
        // Parse EXIF data from the provided file
        const exifData = await parseExifData(file);

        // Create a unique filename and Firebase reference
        const fileName = `images/${uuidv4()}-${file.name}`;
        const storageRef = ref(storage, fileName);

        // Upload the file
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Prepare the data object for Firestore
        const photoDataToSave = {
          imageUrl: downloadURL,
          storagePath: fileName, // Important for easy deletion
          fileName: file.name,
          createdAt: serverTimestamp(),
          dateTaken: exifData.dateTaken,
          cameraMake: exifData.cameraMake,
          cameraModel: exifData.cameraModel,
        };
        await addDoc(collection(db, "photos"), photoDataToSave);
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
      }
    });
    await Promise.all(uploadPromises);
    console.log("All uploads finished.");
  };

  const handlePhotoDelete = async (photo) => {
    if (!window.confirm(`Are you sure you want to delete the photo: "${photo.fileName}"?`)) {
      return;
    }
    try {
      if (photo.storagePath) {
        const storageRef = ref(storage, photo.storagePath);
        await deleteObject(storageRef);
      }
      const docRef = doc(db, "photos", photo.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Failed to delete photo. Please try again.");
    }
  };

  const handleManualEventAdd = async (eventData) => {
    try {
      await addDoc(collection(db, "events"), eventData);
      console.log("Event with recurrence added successfully from manual page!");
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  const openPhotoManager = () => {
    setIsMainMenuOpen(false);
    setIsPhotoPageOpen(true);
  };

  const openAddEventPage = () => {
    setIsMainMenuOpen(false);
    setIsAddEventPageOpen(true);
  };

  return (
    <div className="app-container">
      <PhotoDisplay />
      <CalendarView />
      <button
        className="floating-upload-btn"
        onClick={() => setIsMainMenuOpen(true)}
        title="Open Menu"
      >
        +
      </button>

      <MainMenu
        isOpen={isMainMenuOpen}
        onClose={() => setIsMainMenuOpen(false)}
        onOpenPhotoManager={openPhotoManager}
        onOpenAddEvent={openAddEventPage}
      />
      {/* <PhotoManager
        isOpen={isPhotoPageOpen}
        onClose={() => setIsPhotoPageOpen(false)}
        onUploadMultiple={handleMultipleUploads}
        onDelete={handlePhotoDelete}
      /> */}
      <ManualEventCreator
        isOpen={isAddEventPageOpen}
        onClose={() => setIsAddEventPageOpen(false)}
        onEventAdd={handleManualEventAdd}
      />
    </div>
  );
}

export default App;