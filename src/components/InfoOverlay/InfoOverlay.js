/**
 * @file InfoOverlay.js
 * @description A simple presentational component that serves as a container
 * for displaying informational widgets, such as the date, time, and weather,
 * in the top-left corner of the screen.
 */

import React from "react";

import { isPi } from "../../config/env";
import DateTimeDisplay from "../DateTimeDisplay/DateTimeDisplay";
import WeatherDisplay from '../WeatherDisplay/WeatherDisplay';

import "./InfoOverlay.css";

function InfoOverlay() {
    return (
        <div className={`info-overlay ${isPi ? "pi-mode" : ""}`}>
            <div className="info-overlay-content">
                <DateTimeDisplay />
                {/* Conditionally render WeatherDisplay only on web */}
                {!isPi && <WeatherDisplay />}
            </div>
        </div>
    );
}

export default InfoOverlay;