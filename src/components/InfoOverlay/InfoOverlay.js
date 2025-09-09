/**
 * @file InfoOverlay.js
 * @description A simple presentational component that serves as a container
 * for displaying informational widgets, such as the date, time, and weather,
 * in the top-left corner of the screen.
 */

import React from "react";

import DateTimeDisplay from "../DateTimeDisplay/DateTimeDisplay";
// import WeatherDisplay from '../WeatherDisplay/WeatherDisplay';

import "./InfoOverlay.css";

function InfoOverlay() {
    return (
        <div className="info-overlay">
            <div className="info-overlay-content">
                <DateTimeDisplay />
                {/* Currently disabled due to lack of constant internet checks in offline mode */}
                {/* <WeatherDisplay /> */}
            </div>
        </div>
    );
}

export default InfoOverlay;