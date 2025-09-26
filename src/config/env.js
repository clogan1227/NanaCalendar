/**
 * @file env.js
 * @description Centralized environment configuration.
 * Exports a boolean flag to easily check if the app is running in the
 * Raspberry Pi target environment.
 */

// This checks the environment variable set during the build process.
export const isPi = process.env.REACT_APP_TARGET_ENV === "raspi";