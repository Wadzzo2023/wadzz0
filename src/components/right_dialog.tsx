import { type NextPage } from "next";

import { Dialog, DialogContent } from "./ui/dialog";
import { useRightStore } from "~/lib/state/wallete/right";
import Right from "./wallete/right";
import { RightComponent } from "./right-sidebar";

interface Props {
  key?: React.Key;
}

const RightDialog: NextPage<Props> = ({}) => {
  const urs = useRightStore();
  return (
    <Dialog open={urs.open} onOpenChange={urs.setOpen}>
      <DialogContent className="scrollbar-style !m-0 max-h-screen overflow-y-auto !rounded-xl !p-1">
        <div>
          <RightComponent />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RightDialog;
