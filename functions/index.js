// Import the specific trigger functions you need
const {onObjectFinalized} = require("firebase-functions/v2/storage");
const {onRequest} = require("firebase-functions/v2/https");

// Standard imports for Firebase Admin, etc.
const {initializeApp, getApps} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getStorage, getDownloadURL} = require("firebase-admin/storage");
const path = require("path");
const os = require("os");
const fs = require("fs");
const sharp = require("sharp");

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp();
}

const db = getFirestore();
const storage = getStorage();

const MAX_WIDTH = 1080;
const MAX_HEIGHT = 960;

exports.processAndSavePhoto = onObjectFinalized(
    {region: "us-west1", memory: "512MiB"}, async (event) => {
      const fileBucket = event.data.bucket;
      const filePath = event.data.name;
      const contentType = event.data.contentType;

      const bucket = storage.bucket(fileBucket);

      if (!contentType.startsWith("image/") ||
      !filePath.startsWith("raw-uploads/")) {
        console.log("Not an image or not in the correct folder. Exiting.");
        return null;
      }

      try {
      // Extract document ID from the uploaded filename.
        const docId = path.basename(filePath, path.extname(filePath));
        console.log(`Processing photo for Firestore document ID: ${docId}`);

        const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
        await bucket.file(filePath).download({destination: tempFilePath});

        // Process the image.
        const newFileName = `${docId}.webp`; // Use the ID for the new name too
        const newFilePath = `processed-images/${newFileName}`;
        const tempNewPath = path.join(os.tmpdir(), newFileName);

        await sharp(tempFilePath)
            .rotate()
            .resize(MAX_WIDTH, MAX_HEIGHT, {
              fit: "cover",
              position: sharp.strategy.entropy,
            })
            .webp({quality: 80})
            .toFile(tempNewPath);

        await bucket.upload(tempNewPath, {
          destination: newFilePath,
          metadata: {contentType: "image/webp"},
        });
        console.log("Optimized image uploaded to", newFilePath);

        const downloadURL = await getDownloadURL(
            storage.bucket(fileBucket).file(newFilePath),
        );

        // Get reference to existing document and update it.
        const photoRef = db.collection("photos").doc(docId);

        await photoRef.update({
          status: "complete",
          imageUrl: downloadURL,
          storagePath: newFilePath,
        });
        console.log(`Successfully updated document: ${docId}`);

        // Clean up original file.
        await bucket.file(filePath).delete();
        fs.unlinkSync(tempFilePath);
        fs.unlinkSync(tempNewPath);
      } catch (error) {
        console.error("Failed to process image:", error);
        const docId = path.basename(filePath, path.extname(filePath));
        if (docId) {
          await db.collection("photos")
              .doc(docId).update({status: "error"});
        }
      }
      return null;
    });

exports.backfillExistingImages = onRequest(
    {region: "us-west1", memory: "512MiB"}, async (req, res) => {
      const photosRef = db.collection("photos");
      const snapshot = await photosRef.get();

      if (snapshot.empty) {
        res.send("No photos found to process.");
        return;
      }

      const bucket = storage.bucket("nanacalendar-9d354.firebasestorage.app");
      let successCount = 0;
      let errorCount = 0;

      const processingPromises = snapshot.docs.map(async (doc) => {
        const photoData = doc.data();
        const originalPath = photoData.storagePath;

        if (!originalPath ||
        originalPath.endsWith(".webp") ||
        originalPath.startsWith("processed-images/")) {
          return;
        }

        const fileName = path.basename(originalPath);
        const tempFilePath = path.join(os.tmpdir(), fileName);

        try {
          await bucket.file(originalPath).download({destination: tempFilePath});

          const newFileName = `${path.parse(fileName).name}.webp`;
          const tempNewPath = path.join(os.tmpdir(), newFileName);

          await sharp(tempFilePath)
              .rotate()
              .resize(MAX_WIDTH, MAX_HEIGHT, {
                fit: "cover",
                position: sharp.strategy.entropy,
              })
              .webp({quality: 80})
              .toFile(tempNewPath);

          const newFilePath = `processed-images/${newFileName}`;
          const [uploadedFile] = await bucket.upload(tempNewPath, {
            destination: newFilePath,
            metadata: {contentType: "image/webp"},
          });

          const downloadURL = await uploadedFile.getSignedUrl({
            action: "read",
            expires: "03-09-2491",
          }).then((urls) => urls[0]);

          await photosRef.doc(doc.id).update({
            imageUrl: downloadURL,
            storagePath: newFilePath,
          });

          console.log(`Successfully processed and updated ${fileName}`);

          fs.unlinkSync(tempFilePath);
          fs.unlinkSync(tempNewPath);
          successCount++;
        } catch (error) {
          console.error(`Failed to process ${fileName}:`, error);
          errorCount++;
        }
      });

      await Promise.all(processingPromises);

      res.send(`Complete. Success: ${successCount}, Errs: ${errorCount}`);
    });

exports.refreshPhotoURLs = onRequest(
    {region: "us-west1", memory: "512MiB"}, async (req, res) => {
      try {
        const photosSnapshot = await db.collection("photos").get();
        const bucketName = storage.bucket().name;

        let updatedCount = 0;
        for (const doc of photosSnapshot.docs) {
          const photo = doc.data();
          if (!photo.storagePath) continue;

          try {
            const downloadURL = await getDownloadURL(
                storage.bucket(bucketName).file(photo.storagePath),
            );
            await doc.ref.update({imageUrl: downloadURL});
            updatedCount++;
          } catch (err) {
            console.error(`Failed to refresh URL for ${doc.id}`, err.message);
          }
        }

        console.log(`Refreshed ${updatedCount} image URLs.`);
        res.status(200).send(`✅ Refreshed ${updatedCount} image URLs.`);
      } catch (error) {
        console.error("Error refreshing URLs:", error);
        res.status(500).send("❌ Server error: " + error.message);
      }
    });
