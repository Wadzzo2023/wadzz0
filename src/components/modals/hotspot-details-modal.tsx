"use client";

import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/shadcn/ui/dialog";
import { api } from "~/utils/api";

type Props = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  hotspotId: string | null;
};

const HotspotDetailModal: React.FC<Props> = ({
  isOpen,
  setIsOpen,
  hotspotId,
}) => {
  const hotspotQuery = api.maps.pin.getHotspot.useQuery(
    { hotspotId: hotspotId ?? "" },
    { enabled: !!hotspotId && isOpen },
  );
  console.log("Hotspot query:", hotspotId);
  const pauseSchedule = api.maps.pin.pauseHotspotSchedule.useMutation();
  const resumeSchedule = api.maps.pin.resumeHotspotSchedule.useMutation();
  const deleteCascade = api.maps.pin.deleteHotspotCascade.useMutation();

  const h = hotspotQuery.data;

  useEffect(() => {
    if (!isOpen) hotspotQuery.remove();
  }, [isOpen, hotspotQuery]);

  const handlePause = () => {
    if (!hotspotId) return;
    pauseSchedule.mutate({ hotspotId });
  };
  const handleResume = () => {
    if (!hotspotId) return;
    resumeSchedule.mutate({ hotspotId });
  };
  const handleDelete = () => {
    if (!hotspotId) return;
    if (
      window.confirm(
        "This will hide the hotspot and all of its location groups. Continue?",
      )
    ) {
      deleteCascade.mutate({ hotspotId });
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="overflow-hidden rounded-xl border border-border bg-card p-0 shadow-xl sm:max-w-md">
        <div className="px-6 pb-6 pt-5">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-card-foreground">
                  {h?.title || "Hotspot"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-[0.7rem] uppercase tracking-widest text-muted-foreground">
                  {h ? "Schedule details" : null}
                </DialogDescription>
              </div>

              {h && (
                <span
                  className={[
                    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-widest",
                    h.isActive
                      ? "border-primary/25 bg-primary/10 text-primary"
                      : "border-border bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      h.isActive
                        ? "bg-primary shadow-[0_0_6px_hsl(var(--primary))]"
                        : "bg-muted-foreground",
                    ].join(" ")}
                  />
                  {h.isActive ? "Active" : "Stopped"}
                </span>
              )}
            </div>
          </DialogHeader>

          {hotspotQuery.isLoading && (
            <div className="mt-6 flex items-center gap-2 text-xs tracking-wide text-muted-foreground">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              Loading…
            </div>
          )}

          {h && (
            <>
              {/* Data grid */}
              <div className="mt-5 divide-y divide-border overflow-hidden rounded-lg border border-border">
                {/* Row 1: two cols */}
                <div className="grid grid-cols-2 divide-x divide-border">
                  <DataCell
                    label="Start"
                    value={h.hotspotStartDate.toLocaleString()}
                  />
                  <DataCell
                    label="End"
                    value={h.hotspotEndDate.toLocaleString()}
                  />
                </div>
                {/* Row 2: two cols */}
                <div className="grid grid-cols-2 divide-x divide-border">
                  <DataCell
                    label="Drop every"
                    value={`${h.dropEveryDays} days`}
                  />
                  <DataCell
                    label="Pin duration"
                    value={`${h.pinDurationDays} days`}
                  />
                </div>
                {/* Row 3: full width */}
                <DataCell
                  label="Next run"
                  value={
                    h.qstash?.nextScheduleTime
                      ? new Date(h.qstash.nextScheduleTime).toLocaleString()
                      : "—"
                  }
                />
                {/* Row 4: full width */}
                <DataCell
                  label="Scheduled"
                  value={h.qstashScheduleId ? "Yes" : "No"}
                  valueClassName={
                    h.qstashScheduleId
                      ? "text-primary"
                      : "text-muted-foreground"
                  }
                />
              </div>

              <DialogFooter className="mt-5 flex gap-2">
                {/* <button
                                    onClick={handlePause}
                                    disabled={pauseSchedule.isLoading || !h.isActive}
                                    className={[
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors duration-150",
                                        h.isActive
                                            ? "bg-secondary/60 hover:bg-secondary text-secondary-foreground border-border cursor-pointer"
                                            : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50",
                                    ].join(" ")}
                                >
                                    {pauseSchedule.isLoading ? "Pausing…" : h.isActive ? "Pause schedule" : "Paused"}
                                </button>
                                <button
                                    onClick={handleResume}
                                    disabled={resumeSchedule.isLoading || h.isActive}
                                    className={[
                                        "flex-1 py-2 px-4 rounded-lg text-sm font-medium border transition-colors duration-150",
                                        !h.isActive
                                            ? "bg-secondary/60 hover:bg-secondary text-secondary-foreground border-border cursor-pointer"
                                            : "bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50",
                                    ].join(" ")}
                                >
                                    {resumeSchedule.isLoading ? "Resuming…" : !h.isActive ? "Resume schedule" : "Resumed"}
                                </button> */}

                <button
                  onClick={handleDelete}
                  disabled={deleteCascade.isLoading}
                  className="flex-1 cursor-pointer rounded-lg border border-destructive/25 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive transition-colors duration-150 hover:bg-destructive/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleteCascade.isLoading ? "Deleting…" : "Delete hotspot"}
                </button>
              </DialogFooter>
            </>
          )}
        </div>

        <DialogClose className="absolute right-4 top-4 text-muted-foreground transition-colors hover:text-foreground" />
      </DialogContent>
    </Dialog>
  );
};

// Small helper so the grid cells stay DRY
const DataCell: React.FC<{
  label: string;
  value: string;
  valueClassName?: string;
}> = ({ label, value, valueClassName }) => (
  <div className="bg-card px-4 py-3">
    <p className="mb-0.5 text-[0.65rem] uppercase tracking-widest text-muted-foreground">
      {label}
    </p>
    <p
      className={`text-sm tabular-nums text-card-foreground ${valueClassName ?? ""}`}
    >
      {value}
    </p>
  </div>
);

export default HotspotDetailModal;
