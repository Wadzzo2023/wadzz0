import React, { useEffect, useState } from "react";
import LeftBar from "./left-sidebar";
import RightBar from "./right-sidebar";
import BottomNav from "./mobile/bottom-nav";
import TopNav from "./mobile/top-nav";
import { ConnectWalletButton } from "package/connect_wallet";
import { useSession } from "next-auth/react";

const themes = [
  "light",
  "dark",
  "cupcake",
  "bumblebee",
  "emerald",
  "corporate",
  "synthwave",
  "retro",
  "cyberpunk",
  "valentine",
  "halloween",
  "garden",
  "forest",
  "aqua",
  "lofi",
  "pastel",
  "fantasy",
  "wireframe",
  "black",
  "luxury",
  "dracula",
  "cmyk",
  "autumn",
  "business",
  "acid",
  "lemonade",
  "night",
  "coffee",
  "winter",
  "dim",
  "nord",
  "sunset",
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const [theme, setTheme] = useState(themes[0] ?? "dark");

  useEffect(() => {
    const htmlElement = document.querySelector("html");
    if (!htmlElement) return;
    htmlElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    // <div className="flex h-screen gap-2 bg-gradient-to-r from-teal-400 to-yellow-200 p-2">
    // <div className="flex h-screen gap-2 bg-gradient-to-r from-green-300 via-green-400 to-teal-300 p-2">
    <div className="gradient-background flex h-screen  gap-2 p-2">
      <LeftBar />
      <div className="flex-1">
        <div className="background-color   h-full overflow-y-auto rounded-lg scrollbar-hide">
          <TopNav />
          {data?.user.id ? (
            <>{children}</>
          ) : (
            <div className="flex h-full items-center justify-center">
              <ConnectWalletButton />
            </div>
          )}
          <BottomNav />
        </div>
      </div>
      <RightBar />
      <ThemeChange />
    </div>
  );

  function ThemeChange() {
    return (
      <div className="fixed right-0 top-14 p-4">
        <div className="dropdown dropdown-end ">
          <div tabIndex={0} role="button" className="btn m-1">
            themes
          </div>
          <ul
            tabIndex={0}
            className="menu dropdown-content z-[1] w-52 rounded-box bg-base-100 p-2 shadow"
          >
            {themes.map((theme) => (
              <li key={theme}>
                <a onClick={() => setTheme(theme)}>{theme}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
}
