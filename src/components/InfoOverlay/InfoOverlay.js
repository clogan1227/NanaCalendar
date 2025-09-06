import React from 'react';
import DateTimeDisplay from '../DateTimeDisplay/DateTimeDisplay';
// import WeatherDisplay from '../WeatherDisplay/WeatherDisplay';
import './InfoOverlay.css';

function InfoOverlay() {
    return (
        <div className="info-overlay">
            <div className="info-overlay-content">
                <DateTimeDisplay />
                {/* <WeatherDisplay /> */}
            </div>
        </div>
    );
}

export default InfoOverlay;