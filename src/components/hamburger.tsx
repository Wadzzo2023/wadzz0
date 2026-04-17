import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "src/components/ui/sheet";
import { useDrawerOpenStore } from "~/lib/state/fan/drawer_open";
import LeftBar from "./left-sidebar";

function Hamburger({
  layoutMode = "modern",
  onToggleLayoutMode,
}: {
  layoutMode?: "modern" | "legacy";
  onToggleLayoutMode?: () => void;
}) {
  const doStore = useDrawerOpenStore();
  return (
    <Sheet open={doStore.isOpen} onOpenChange={doStore.setIsOpen}>
      <SheetTrigger className="btn">
        <Menu />
      </SheetTrigger>
      <SheetContent side={"left"} className="w-80 !px-0 py-8 ">
        <LeftBar
          className="bg-base-100"
          layoutMode={layoutMode}
          onToggleLayoutMode={onToggleLayoutMode}
        />
      </SheetContent>
    </Sheet>
  );
}

export default Hamburger;
