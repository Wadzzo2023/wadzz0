import { ConnectWalletButton } from "package/connect_wallet";
import React from "react";
import Avater from "./ui/avater";
import { useSession } from "next-auth/react";
import Button from "./ui/button";
import Link from "next/link";
import Logo from "./logo";
import {
  HomeIcon,
  PenSquare,
  Search,
  Settings2,
  Diamond,
  Bell,
  Store,
} from "lucide-react";
import { api } from "~/utils/api";
import { Mode, useMode } from "~/lib/state/left-side-mode";
import { useRouter } from "next/router";

export const UserNavigation = {
  Home: { path: "/", icon: HomeIcon, text: "Home" },
  Search: { path: "/search", icon: Search, text: "Search" },
  YourAsset: { path: "/assets", icon: Diamond, text: "Assets" },
  Notification: { path: "/notification", icon: Bell, text: "Notification" },
  Settings: { path: "/settings", icon: Settings2, text: "Settings" },
} as const;

export const CreatorNavigation = {
  Page: { path: "/me/creator", icon: PenSquare, text: "Page" },
  Create: { path: "/posts/creator", icon: PenSquare, text: "Create" },
  Store: { path: "/store/creator", icon: Store, text: "Store" },
  Notification: {
    path: "/notification/creator",
    icon: Bell,
    text: "Notification",
  },
  Settings: { path: "/settings/creator", icon: Settings2, text: "Settings" },
} as const;

const themes = ["cupcake", "forest"];
const xthemes = [
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

export default function LeftBar() {
  const [theme, setTheme] = React.useState(themes[0] ?? "dark");

  React.useEffect(() => {
    const htmlElement = document.querySelector("html");
    if (!htmlElement) return;
    htmlElement.setAttribute("data-theme", theme);
  }, [theme]);
  return (
    <div className="hidden flex-col items-center justify-between gap-2     sm:flex sm:w-56 md:w-80">
      <div className="background-color flex w-full flex-1 flex-col items-center gap-2 rounded-lg py-2">
        <Logo />
        <div className="w-2/3 flex-1">
          <NavigationButtons />
        </div>
      </div>
      <div className="background-color flex w-full flex-col items-center rounded-lg py-4">
        <div className="flex w-2/3 flex-col justify-center">
          <div className="flex w-full  flex-col items-start ">
            <Profile />
            <ConnectWalletButton />
            <ThemeChange />
          </div>
        </div>
      </div>
    </div>
  );

  function ThemeChange() {
    return (
      <div className="dropdown dropdown-top ">
        <div tabIndex={0} role="button" className="btn m-1 ">
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
    );
  }
}

function NavigationButtons() {
  const { selectedMenu, toggleSelectedMenu } = useMode();

  function getNavigation() {
    if (selectedMenu == Mode.Creator) return CreatorNavigation;
    else return UserNavigation;
  }

  return (
    <div className="flex h-full w-full flex-col items-start justify-center gap-2 ">
      {Object.entries(getNavigation()).map(
        ([key, { path, icon: Icon, text }]) => (
          <Link href={path} className="w-full" key={key}>
            <Button
              path={path}
              icon={<Icon className="h-5 w-5" />}
              text={text}
            />
          </Link>
        ),
      )}
    </div>
  );
}

function ProfileComponent({
  avaterUrl,
  handleModeChange,
  name,
  mode,
}: {
  avaterUrl: string | null;
  handleModeChange: () => void;
  name: string | null;
  mode: Mode;
}) {
  return (
    <div
      className="btn my-2 items-center  justify-start gap-2"
      onClick={handleModeChange}
    >
      <Avater url={avaterUrl} />
      <div className="flex flex-col items-start">
        <p className="">{name}</p>
        <p>Switch to {mode}</p>
      </div>
    </div>
  );
}

function UserAvater() {
  const router = useRouter();
  const { setSelectedMenu } = useMode();
  const user = api.user.getUser.useQuery();
  const handleClick = () => {
    setSelectedMenu(Mode.Creator);
    router.push("/me/creator");
  };
  if (user.data) {
    return (
      <ProfileComponent
        handleModeChange={handleClick}
        avaterUrl={user.data.image}
        mode={Mode.Creator}
        name={user.data.name}
      />
    );
  }
}
function CreatorAvater() {
  const router = useRouter();
  const { setSelectedMenu } = useMode();
  const creator = api.creator.meCreator.useQuery();

  const handleClick = () => {
    setSelectedMenu(Mode.User);
    router.push("/");
  };

  return (
    <ProfileComponent
      handleModeChange={handleClick}
      avaterUrl={creator?.data?.profileUrl ?? null}
      mode={Mode.User}
      name={creator?.data?.name ?? "Unknown"}
    />
  );
}

function Profile() {
  const { selectedMenu, getAnotherMenu, toggleSelectedMenu } = useMode();

  const creator = api.creator.meCreator.useQuery();

  if (selectedMenu == Mode.User) {
    return <UserAvater />;
  } else return <CreatorAvater />;
}
