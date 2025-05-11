/* eslint-disable */
import React from "react";
import Script from "next/script";

export default function test() {
  return (
    <div>
      <Script
        strategy="lazyOnload"
        src="https://portal-embed.pages.dev/chatIcon.js"
        type="module"
      ></Script>
    </div>
  );
}
