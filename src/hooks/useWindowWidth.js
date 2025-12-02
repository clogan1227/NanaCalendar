import { useState, useEffect } from "react";

/**
 * A custom React hook that returns the current width of the browser window.
 * It efficiently updates the width on window resize.
 * @returns {number} The current window width in pixels.
 */
export function useWindowWidth() {
    const [width, setWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);
        // Cleanup function to remove the listener when the component unmounts
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return width;
}