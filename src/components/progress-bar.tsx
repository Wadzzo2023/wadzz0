"use client";

import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

const ProgressProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      {children}
      <ProgressBar
        height="5px"
        color="#00bdfb"
        options={{
          showSpinner: true,
          minimum: 0.1,
          easing: "ease",
          speed: 500,
        }}
        shallowRouting
      />
    </>
  );
};

export default ProgressProvider;
