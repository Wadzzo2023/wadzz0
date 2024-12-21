import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "src/components/ui/sheet";
import { useDrawerOpenStore } from "~/lib/state/fan/drawer_open";
import LeftBar from "./left-sidebar";

function Hamburger() {
  const doStore = useDrawerOpenStore();
  return (
    <Sheet open={doStore.isOpen} onOpenChange={doStore.setIsOpen}>
      <SheetTrigger className="btn">
        <Menu />
      </SheetTrigger>
      <SheetContent side={"left"} className="w-80 !px-0 py-8 ">
        <LeftBar className="bg-base-100" />
      </SheetContent>
    </Sheet>
  );
}

export default Hamburger;
