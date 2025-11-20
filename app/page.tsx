import Image from "next/image";
import ScreenSwitcher from "../components/screen-switcher";
import SettingsMenu from "../components/SettingsMenu";
import LatestCloolessVideos from "../components/LatestVideos";
import Clock from "../components/Clock";
import SpotifyController from "../components/SpotifyController";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-white font-sans flex-col">
      <header className="flex flex-row items-center justify-between gap-6 p-6">
        <div className="flex flex-row items-center gap-4 pointer-events-none select-none">
          <Image
            src="/hero.png"
            alt="Logo"
            width={48}
            height={48}
            className=""
          />
          <p className="text-3xl font-medium text-black">Clooless</p>
        </div>

        <div className="flex items-center gap-2">
          <SettingsMenu />
          <ScreenSwitcher />
        </div>
      </header>
      <div className="px-6 flex-1 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
          <Clock />
          <SpotifyController />
        </div>
        <LatestCloolessVideos />
      </div>
    </div>
  );
}
