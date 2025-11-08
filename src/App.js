/**
 * @file App.js
 * @description This is the root component of the application. It orchestrates the main
 * UI components, manages the state for various overlays (main menu, photo manager,
 * event creator), and handles core Firebase interactions like photo uploads,
 * deletions, and event creation.
 */

import React, { useState } from "react";

import EXIF from "exif-js"; // For reading metadata from image files
import { collection, addDoc, Timestamp, doc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { v4 as uuidv4 } from "uuid"; // For generating unique IDs

import CalendarView from "./components/CalendarView/CalendarView";
import MainMenu from "./components/MainMenu/MainMenu";
import ManualEventCreator from "./components/ManualEventCreator/ManualEventCreator";
import PhotoDisplay from "./components/PhotoDisplay/PhotoDisplay";
import PhotoManager from "./components/PhotoManager/PhotoManager";
import { db, storage } from "./firebase"; // Firebase service instances

import "./App.css";

/**
 * Wraps the callback-based EXIF.getData function in a modern Promise for use with async/await.
 * @param {File} file - The image file to parse for EXIF data.
 * @returns {Promise<object>} A promise that resolves with an object containing the
 * date taken, camera make, and camera model.
 */
const parseExifData = (file) => {
  return new Promise((resolve) => {
    EXIF.getData(file, function () {
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
        // Resolve with nulls if no date metadata is found in the image.
        resolve({ dateTaken: null, cameraMake: null, cameraModel: null });
      }
    });
  });
};

function App() {
  // State for controlling the visibility of the main menu overlay.
  const [isMainMenuOpen, setIsMainMenuOpen] = useState(false);
  // State for controlling the visibility of the photo manager page/overlay.
  const [isPhotoPageOpen, setIsPhotoPageOpen] = useState(false);
  // State for controlling the visibility of the manual event creator page/overlay.
  const [isAddEventPageOpen, setIsAddEventPageOpen] = useState(false);

  // A derived boolean to easily check if any overlay is currently active.
  const isOverlayOpen =
    isMainMenuOpen || isPhotoPageOpen || isAddEventPageOpen;

  /**
     * Handles the client-side process for uploading multiple raw image files.
     * For each file, this function parses EXIF data, attaches that data to the
     * file as custom metadata, and uploads the raw file to a temporary
     * 'raw-uploads/' directory in Firebase Storage. This function's sole
     * responsibility is to get the raw file and its metadata into Storage;
     * a Cloud Function is responsible for all subsequent processing and
     * database entries.
     * @param {File[]} files - An array of File objects from a file input element.
     */
  const handleMultipleUploads = async (files) => {
    console.log(`Uploading ${files.length} raw files...`);
    const uploadPromises = files.map(async (file) => {
      try {
        const exifData = await parseExifData(file);

        const fileName = `${uuidv4()}-${file.name}`;
        const storageRef = ref(storage, `raw-uploads/${fileName}`);

        const metadata = {
          customMetadata: {
            dateTaken: exifData.dateTaken || "unknown",
            cameraMake: exifData.cameraMake || "unknown",
            cameraModel: exifData.cameraModel || "unknown",
            originalFileName: file.name, // Keep the original name
          },
        };

        await uploadBytes(storageRef, file, metadata);
        console.log(`Successfully uploaded raw file: ${file.name}`);
      } catch (error) {
        console.error(`Failed to upload raw file ${file.name}:`, error);
      }
    });

    await Promise.all(uploadPromises);
    console.log("All raw file uploads finished.");
  };

  /**
   * Deletes a single photo. This involves deleting the file from Firebase Storage
   * and then the document from Firestore. It now includes a 'skipConfirmation'
   * parameter to bypass the confirmation dialog when called from a batch process.
   * @param {object} photo - The photo object containing its ID and storagePath.
   * @param {boolean} [skipConfirmation=false] - If true, the user confirmation prompt is skipped.
   */
  const handlePhotoDelete = async (photo, skipConfirmation = false) => {
    // The confirmation dialog is now conditional.
    if (
      !skipConfirmation &&
      !window.confirm(
        `Are you sure you want to delete the photo: "${photo.fileName}"?`,
      )
    ) {
      return;
    }
    try {
      // First, delete the file from Cloud Storage.
      if (photo.storagePath) {
        const storageRef = ref(storage, photo.storagePath);
        await deleteObject(storageRef);
      }
      // Then, delete the document from the Firestore collection.
      const docRef = doc(db, "photos", photo.id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting photo:", error);
      // This function will now throw an error on failure, allowing the
      // calling function to handle alerts for a better user experience.
      throw new Error(`Failed to delete ${photo.fileName}.`);
    }
  };

  /**
   * Orchestrates the deletion of multiple selected photos. It now uses Promise.allSettled
   * to ensure all deletions are attempted, and then provides a single summary of
   * any failures to the user.
   * @param {object[]} photosToDelete - An array of photo objects to be deleted.
   */
  const handleMultipleDeletes = async (photosToDelete) => {
    if (
      !window.confirm(
        `Are you sure you want to delete ${photosToDelete.length} selected photos?`,
      )
    )
      return;

    console.log("Deleting multiple photos...");
    // We call handlePhotoDelete with `true` to skip the individual confirmations.
    const deletePromises = photosToDelete.map((photo) =>
      handlePhotoDelete(photo, true),
    );

    // Promise.allSettled will wait for all promises to complete, whether they
    // succeed or fail. This is better than Promise.all for this use case.
    const results = await Promise.allSettled(deletePromises);

    // We can now collect all the error messages from failed deletions.
    const failedDeletions = results.filter((r) => r.status === "rejected");

    if (failedDeletions.length > 0) {
      // If there were any failures, show ONE alert summarizing them.
      const errorMessages = failedDeletions
        .map((fail) => fail.reason.message)
        .join("\n");
      alert(
        `Some photos could not be deleted:\n\n${errorMessages}\n\nPlease try again.`,
      );
    }
    console.log("Finished deleting selected photos.");
  };

  /**
   * Adds a new event document to the 'events' collection in Firestore.
   * @param {object} eventData - The event data to be saved.
   */
  const handleManualEventAdd = async (eventData) => {
    try {
      await addDoc(collection(db, "events"), eventData);
      console.log("Event with recurrence added successfully from manual page!");
    } catch (error) {
      console.error("Error adding event: ", error);
    }
  };

  // Manages UI state transition from the main menu to the photo manager.
  const openPhotoManager = () => {
    setIsMainMenuOpen(false);
    setIsPhotoPageOpen(true);
  };

  // Manages UI state transition from the main menu to the add event page.
  const openAddEventPage = () => {
    setIsMainMenuOpen(false);
    setIsAddEventPageOpen(true);
  };

  return (
    <div className="app-container">
      <PhotoDisplay
        showMenuButton={!isOverlayOpen}
        onOpenMenu={() => setIsMainMenuOpen(true)}
      />
      <CalendarView />

      {/* The following components are overlays managed by component state */}
      <MainMenu
        isOpen={isMainMenuOpen}
        onClose={() => setIsMainMenuOpen(false)}
        onOpenPhotoManager={openPhotoManager}
        onOpenAddEvent={openAddEventPage}
      />
      <PhotoManager
        isOpen={isPhotoPageOpen}
        onClose={() => setIsPhotoPageOpen(false)}
        onUploadMultiple={handleMultipleUploads}
        onDelete={handlePhotoDelete}
        onMultiDelete={handleMultipleDeletes}
      />
      <ManualEventCreator
        isOpen={isAddEventPageOpen}
        onClose={() => setIsAddEventPageOpen(false)}
        onEventAdd={handleManualEventAdd}
      />
    </div>
  );
}

export default App;