import { Loader2 } from "lucide-react";

import { api } from "~/utils/api";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/shadcn/ui/table";
import { Button } from "~/components/shadcn/ui/button";
import { z } from "zod";
import { CreatorConsumedPin, useModal } from "~/lib/state/play/use-modal-store";
import { addrShort } from "~/utils/utils";

const CreatorCollectionReport = () => {
    const pins = api.maps.pin.getCreatorPinTConsumedByUser.useQuery();
    console.log("pins", pins);
    if (pins.isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!pins.data) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-lg font-semibold text-gray-600">No data available</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
                Creator Collection Reports
            </h2>
            <div className="rounded-lg border border-gray-200 bg-white shadow-md">
                <TableData pins={pins.data} />
            </div>
        </div>
    );
};

export default CreatorCollectionReport;




export function TableData({ pins }: { pins: CreatorConsumedPin[] }) {
    const { onOpen } = useModal();
    console.log("Pins:", pins);

    if (pins.length === 0) {
        return (
            <div className="p-4 text-center text-gray-600">
                No data available. Please check your data source.
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-end gap-4 p-4">
                <ReportDownload day={7}>Download Weekly Report</ReportDownload>
                <ReportDownload day={30}>Download Monthly Report</ReportDownload>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Location Group ID</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead className="w-[200px]">Location (Lat | Lng)</TableHead>
                        <TableHead>Consumer ID</TableHead>
                        <TableHead>Email</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {pins.flatMap((pin) =>
                        pin.locations.flatMap((location) =>
                            location.consumers.length > 0 ? (
                                location.consumers.map((consumer, consumerIndex) => (
                                    <TableRow key={`${pin.id}-${location.id}-${consumer.user.id}-${consumerIndex}`}>
                                        {consumerIndex === 0 ? (
                                            <>
                                                <TableCell className="font-medium" rowSpan={location._count.consumers}>
                                                    {pin.id}
                                                </TableCell>
                                                <TableCell rowSpan={location._count.consumers}>{pin.title}</TableCell>
                                                <TableCell className="font-medium" rowSpan={location._count.consumers}>
                                                    {location.latitude.toFixed(6)} | {location.longitude.toFixed(6)}
                                                </TableCell>
                                            </>
                                        ) : null}
                                        <TableCell>{addrShort(consumer.user.id, 5)}</TableCell>
                                        <TableCell>{consumer.user.email ?? "Stellar Loggedin"}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow key={`${pin.id}-${location.id}-no-consumers`}>
                                    <TableCell>{pin.id}</TableCell>
                                    <TableCell>{pin.title}</TableCell>
                                    <TableCell>{location.latitude.toFixed(6)} | {location.longitude.toFixed(6)}</TableCell>
                                    <TableCell colSpan={2} className="text-center text-gray-500">No consumers for this location</TableCell>
                                </TableRow>
                            )
                        )
                    )}
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
    const download = api.maps.pin.downloadCreatorPinTConsumedByUser.useMutation({
        onSuccess: (data) => {
            console.log(data.length);
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

function DownloadPinLocationAsCSV(data: CreatorConsumedPin[]) {
    const csvContent = [
        [
            "pin_title", "pin_id", "start_date", "end_date",
            "location_id", "latitude", "longitude",
            "auto_collect", "consumer_name", "consumer_email", "consumed_at"
        ], // CSV headers
        ...data.flatMap((pin) =>
            pin.locations.flatMap((location: any) =>
                (location.consumers || []).map((consumer: any) => [
                    pin.title,
                    pin.id,
                    new Date(pin.startDate).toISOString(),
                    new Date(pin.endDate).toISOString(),
                    location.id,
                    location.latitude,
                    location.longitude,
                    location.autoCollect,
                    consumer.name || "N/A", // Consumer name or fallback
                    consumer.email || "", // Consumer email or empty string
                    consumer.consumedAt
                        ? new Date(consumer.consumedAt).toISOString() // Consumed date
                        : "",
                ])
            )
        ),
    ]
        .map((e) => e.join(",")) // Convert each row into a comma-separated string
        .join("\n"); // Combine all rows with newline characters

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