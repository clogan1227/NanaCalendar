/**
 * @file WeatherDisplay.js
 * @description A component that fetches and displays current weather data from the
 * OpenWeatherMap API for a predefined location. It handles loading and error states,
 * and automatically refreshes the data every 10 minutes.
 */

import React, { useState, useEffect } from "react";

import "./WeatherDisplay.css";

// --- Configuration Constants ---
const CITY_ID = "5789381"; // The OpenWeatherMap ID for Nana's city.
const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY; // The API key, stored securely.
const UNITS = "imperial"; // 'imperial' for Fahrenheit, 'metric' for Celsius.

function WeatherDisplay() {
    // State to hold the weather data object returned from the API.
    const [weatherData, setWeatherData] = useState(null);
    // State to store any error messages that occur during the fetch.
    const [error, setError] = useState(null);
    // State to manage the loading indicator while fetching data.
    const [isLoading, setIsLoading] = useState(true);

    /**
     * This effect handles the entire lifecycle of fetching weather data. It runs once on
     * component mount to perform the initial fetch and then sets up an interval to
     * periodically refresh the data.
     */
    useEffect(() => {
        // A crucial failsafe to prevent API calls if the API key is missing.
        if (!API_KEY) {
            setError("Weather API key is missing.");
            setIsLoading(false);
            return;
        }

        const fetchWeather = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const response = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?id=${CITY_ID}&appid=${API_KEY}&units=${UNITS}`,
                );
                // Handle non-successful HTTP responses (e.g., 401, 404, 500).
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(
                        errorData.message || `HTTP error! status: ${response.status}`,
                    );
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (e) {
                console.error("Failed to fetch weather data:", e);
                setError(e.message || "Failed to fetch weather.");
            } finally {
                // The 'finally' block ensures that loading is set to false regardless
                // of whether the fetch succeeded or failed.
                setIsLoading(false);
            }
        };

        fetchWeather(); // Perform the initial fetch.

        // Set up an interval to re-fetch the weather every 10 minutes.
        const intervalId = setInterval(fetchWeather, 10 * 60 * 1000);

        // The cleanup function clears the interval when the component unmounts,
        // preventing memory leaks and unnecessary API calls.
        return () => clearInterval(intervalId);
    }, []); // Empty dependency array ensures this effect runs only once on mount.

    // --- Conditional Rendering ---
    if (isLoading) {
        return <div className="weather-display">Loading weather...</div>;
    }

    if (error) {
        return <div className="weather-display error">Error: {error}</div>;
    }

    if (!weatherData) {
        return <div className="weather-display">No weather data.</div>;
    }

    // Extract and format the necessary data from the API response for rendering.
    const temperature = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const iconCode = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    return (
        <div className="weather-display">
            <img src={iconUrl} alt={description} className="weather-icon" />
            <span className="temperature">
                {temperature}°{UNITS === "imperial" ? "F" : "C"}
            </span>
        </div>
    );
}

export default WeatherDisplay;