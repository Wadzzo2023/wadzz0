import React from "react";
import { NextLogin } from "~/utils/next-login";

export default function TestPage() {
  function handleClick(): void {
    NextLogin("test3", "test").catch(() => console.log("err"));
  }

  return (
    <div>
      TestPage
      <button onClick={() => handleClick()}>Login</button>
    </div>
  );
}
