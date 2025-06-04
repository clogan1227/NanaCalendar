import React, { useState, useEffect } from 'react';
import './WeatherDisplay.css';

// You can find city IDs on OpenWeatherMap or use city name/zip.
// New York City ID // CHANGE LATER!!!!!!!!!!!!
const CITY_ID = '5128581';
const API_KEY = process.env.REACT_APP_OPENWEATHERMAP_API_KEY;
const UNITS = 'imperial';

function WeatherDisplay() {
    const [weatherData, setWeatherData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
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
                `https://api.openweathermap.org/data/2.5/weather?id=${CITY_ID}&appid=${API_KEY}&units=${UNITS}`
                );
                if (!response.ok) {
                    // If response is not OK, try to parse error from OpenWeatherMap
                    const errorData = await response.json();
                    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                setWeatherData(data);
            } catch (e) {
                console.error("Failed to fetch weather data:", e);
                setError(e.message || "Failed to fetch weather.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWeather();

        // Refresh weather data every 30 minutes
        const intervalId = setInterval(fetchWeather, 30 * 60 * 1000);

        // Cleanup function
        return () => clearInterval(intervalId);
    }, []);

    if (isLoading) {
        return <div className="weather-display">Loading weather...</div>;
    }

    if (error) {
        return <div className="weather-display error">Error: {error}</div>;
    }

    if (!weatherData) {
        return <div className="weather-display">No weather data.</div>;
    }

    // Extract relevant data
    const temperature = Math.round(weatherData.main.temp);
    const description = weatherData.weather[0].description;
    const iconCode = weatherData.weather[0].icon;
    const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

    return (
        <div className="weather-display">
            <img src={iconUrl} alt={description} className="weather-icon" />
            <span className="temperature">{temperature}°{UNITS === 'imperial' ? 'F' : 'C'}</span>
            {/* <span className="weather-description">{description}</span> */}
        </div>
    );
}

export default WeatherDisplay;