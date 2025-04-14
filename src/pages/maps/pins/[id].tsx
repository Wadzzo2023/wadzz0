import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/shadcn/ui/table";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { useRouter } from "next/router";
import { api } from "~/utils/api";

// Demo data for a pin

// Demo data for consumers

export default function SinglePinPage() {
  const router = useRouter();
  const { id } = router.query;

  const pin = api.maps.pin.getPin.useQuery(id as string);
  if (pin.isLoading) return <p>Loading...</p>;

  if (pin.error) return <p>Error: {pin.error.message}</p>;

  if (pin.data) {
    const demoPin = pin.data;
    return (
      <div className="container mx-auto p-4">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{demoPin.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-muted-foreground">
                  {demoPin.description}
                </p>
                {demoPin.url && (
                  <p>
                    <strong>URL:</strong>{" "}
                    <a
                      href={demoPin.url}
                      className="text-blue-500 hover:underline"
                    >
                      {demoPin.url}
                    </a>
                  </p>
                )}
                <p>
                  <strong>Start Date:</strong>{" "}
                  {demoPin.startDate &&
                    new Date(demoPin.startDate).toLocaleString()}
                </p>
                <p>
                  <strong>End Date:</strong>{" "}
                  {demoPin.endDate && new Date(demoPin.endDate).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center justify-center">
                <Image
                  src={demoPin.image ?? "/favicon.ico"}
                  alt={"demo pin"}
                  width={300}
                  height={300}
                  className="rounded-lg object-cover"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <ConsumersTable consumers={demoPin.consumers} />
      </div>
    );
  }
}

interface Consumer {
  pubkey: string;
  name: string;
  consumptionDate: Date;
}

export function ConsumersTable({ consumers }: { consumers: Consumer[] }) {
  return (
    <>
      <div className="flex items-center justify-between">
        <h2 className="mb-4 text-2xl font-bold">Pin Consumers</h2>
        <Button
          variant="outline"
          onClick={() => {
            DownloadConsumersAsCSV(consumers);
          }}
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Public Key</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Date of Consumption</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumers.map((consumer) => (
            <TableRow key={consumer.pubkey}>
              <TableCell className="font-mono">{consumer.pubkey}</TableCell>
              <TableCell>{consumer.name}</TableCell>
              <TableCell>{consumer.consumptionDate.toDateString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}

function DownloadConsumersAsCSV(consumers: Consumer[]) {
  const csvContent = [
    ["pubkey", "name", "consumption_date"], // Header row
    ...consumers.map((consumer) => [
      consumer.pubkey,
      consumer.name,
      consumer.consumptionDate.toDateString(),
    ]),
  ]
    .map((e) => e.join(","))
    .join("\n");

  // Create a Blob from the CSV data
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });

  // Create a link element and trigger download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "consumers.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
