import { AlignLeft, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/router";
import { Button } from "~/components/shadcn/ui/button";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/shadcn/ui/table";
import { PinLocation } from "~/types/pin";
import { api } from "~/utils/api";

export default function CreatorConsumptionReport() {
  const router = useRouter();
  const pins = api.maps.pin.getCreatorPinThatConsumed.useQuery();
  if (pins.isLoading) return <Loader2 className="animate-spin" />;

  if (pins.data) {
    return (
      <div>
        <div className="flex items-center justify-center">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft />
          </Button>
          <h2 className="p-4 text-center text-2xl font-bold">
            Creators Consumed Reports
          </h2>
        </div>

        <div className="m-auto max-w-4xl">
          <TableDemo pins={pins.data} />
        </div>
      </div>
    );
  }
}

export function TableDemo({ pins }: { pins: PinLocation[] }) {
  return (
    <div>
      <div className="flex items-end justify-end gap-2 p-4">
        <ReportDownload day={7}>
          {" "}
          Download Weekly Collection Report{" "}
        </ReportDownload>
        <ReportDownload day={30}>
          Download Monthly Collection Report
        </ReportDownload>
      </div>
      <Table>
        <TableCaption>My Pin consumption report</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Lat Lan</TableHead>
            <TableHead>Creator</TableHead>
            <TableHead>Consumer</TableHead>
            <TableHead>Collection Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pins.map((pin) => (
            <TableRow key={pin.id}>
              <TableCell className="font-medium">
                {`${pin.location.latitude.toFixed(4)}-${pin.location.longitude.toFixed(4)}`}
              </TableCell>
              <TableCell className="font-medium">
                {pin.location.creator.name}
              </TableCell>
              <TableCell>{pin.user.name}</TableCell>
              <TableCell>{pin.createdAt.toDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ReportDownload({
  day,
  children,
}: {
  day: number;
  children?: React.ReactNode;
}) {
  const download = api.maps.pin.downloadAllConsumedLocation.useMutation({
    onSuccess: (data) => {
      // download this data that is an array of PinLocation as csv
      // Convert array of PinLocation objects to CSV format
      DownloadPinLocationAsCSV(data);
    },
  });
  return (
    <Button
      onClick={() => {
        download.mutate({ day: day });
      }}
    >
      {download.isLoading ? <Loader2 className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

function DownloadPinLocationAsCSV(data: PinLocation[]) {
  const csvContent = [
    ["latitude", "longitude", "creator", "consumer", "consumed_at"], // Assuming these are the fields in PinLocation
    ...data.map((pin) => [
      pin.location.latitude,
      pin.location.longitude,
      pin.location.creator.name,
      pin.user.name,
      pin.createdAt.toDateString(),
    ]),
  ]
    .map((e) => e.join(","))
    .join("\n");

  // Create a Blob from the CSV data
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a link element and trigger a download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "pin_locations.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
