/* eslint-disable */
// @ts-ignore:
import { useRouter } from "next/router";
import { useEffect } from "react";

const AlbedoPage = () => {
  const { query } = useRouter();

  useEffect(() => {
    // Override window.open to create a modal with an iframe instead of a new window
    // @ts-ignore: Override window.open to create a modal with an iframe instead of a new window
    window.open = (url, target, features) => {
      const modal = document.createElement("div");

      // @ts-ignore:
      modal.style = `
        position: fixed; 
        top: 0; 
        left: 0; 
        width: 100%; 
        height: 100%; 
        background: rgba(0, 0, 0, 0.8); 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        z-index: 999;
     `;

      // Create close button
      const closeButton = document.createElement("button");
      closeButton.textContent = "Close";
      // @ts-ignore:
      closeButton.style = `
        position: absolute; 
        top: 20px; 
        right: 20px; 
        padding: 10px 20px; 
        font-size: 16px; 
        background-color: #ff4d4d; 
        color: white; 
        border: none; 
        cursor: pointer;
        border-radius: 5px;
    `;
      closeButton.onclick = () => document.body.removeChild(modal);

      const iframe = document.createElement("iframe");
      // @ts-ignore:
      iframe.src = url;
      // @ts-ignore:
      iframe.style = `
            width: 90%; 
            height: 90%; 
            border: none; 
            border-radius: 8px;
        `;

      modal.appendChild(iframe);
      modal.appendChild(closeButton);
      document.body.appendChild(modal);

      return iframe.contentWindow; // Return iframe window object
    };

    // Load the Albedo library dynamically
    const script = document.createElement("script");
    script.src = "https://unpkg.com/@albedo-link/intent/lib/albedo.intent.js";
    document.body.appendChild(script);

    // Cleanup the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleAlbedoButtonClick = (token: string) => {
    // @ts-ignore:
    albedo.publicKey({ token: token }).then((res) => {

      // @ts-ignore:
      window.ReactNativeWebView?.postMessage(
        JSON.stringify({
          type: "token",
          res: res,
        }),
      );
    });
  };

  const signTransection = (xdr: string) => {
    // @ts-ignore:
    albedo
      .tx({
        xdr: xdr,
      })
      // @ts-ignore:
      .then((res) => {

        // @ts-ignore:
        window.ReactNativeWebView?.postMessage(
          JSON.stringify({
            type: "xdr",
            res: res,
          }),
        );
      });
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        backgroundColor: "#f0f0f0", // Optional background color
      }}
    >
      {query.token && (
        <button
          onClick={() => handleAlbedoButtonClick(query.token as string)}
          style={{
            padding: "15px 30px",
            fontSize: "20px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            margin: "10px",
          }}
        >
          Login with Albedo
        </button>
      )}
      {query.xdr && (
        <button
          onClick={() => signTransection(query.xdr as string)}
          style={{
            padding: "15px 30px",
            fontSize: "20px",
            backgroundColor: "green",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            margin: "10px",
          }}
        >
          Sign the Transaction
        </button>
      )}
    </div>
  );
};

export default AlbedoPage;
