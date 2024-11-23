import { useState, useEffect } from "react";

const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: 0,
    height: 0,
  });

  useEffect(() => {
    // Check if window is defined (i.e., we are in the browser)
    if (typeof window !== "undefined") {
      const handleResize = () => {
        setWindowDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      };

      // Set initial window dimensions
      handleResize();

      window.addEventListener("resize", handleResize);

      // Clean up the event listener on component unmount
      return () => {
        window.removeEventListener("resize", handleResize);
      };
    }
  }, []);

  return windowDimensions;
};

export default useWindowDimensions;
