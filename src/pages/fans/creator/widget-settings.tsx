import { useEffect, useState } from "react";
import { api } from "~/utils/api";
import { Creator } from "@prisma/client";
import { Checkbox } from "~/components/shadcn/ui/checkbox";
import { toast } from "~/hooks/use-toast";
import { Input } from "~/components/shadcn/ui/input";
import { Button } from "~/components/shadcn/ui/button";
import { Loader, Map } from "lucide-react";
import { Slider } from "~/components/shadcn/ui/slider";
import { Label } from "~/components/shadcn/ui/label";

export default function Embed() {
  const [selectedCreators, setSelectedCreators] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [searchResults, setSearchResults] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLocation, setInitialLocation] = useState({
    lat: 40.7128, // Default latitude (New York City)
    lng: -74.006, // Default longitude (New York City)
    zoom: 9, // Default zoom level
  });

  // Get all creators using the API
  const { data: creators, isLoading } = api.fan.creator.getCreators.useQuery();

  // Search functionality
  useEffect(() => {
    if (creators && search) {
      setSearchResults(
        creators.filter(
          (creator) =>
            creator.name.toLowerCase().includes(search.toLowerCase()) ||
            creator.bio?.toLowerCase().includes(search.toLowerCase()),
        ),
      );
    } else {
      setSearchResults([]);
    }
  }, [search, creators]);

  const toggleCreator = (creatorId: string) => {
    setSelectedCreators((prev) => {
      if (prev.includes(creatorId)) {
        return prev.filter((id) => id !== creatorId);
      } else {
        return [...prev, creatorId];
      }
    });
  };

  const handleGenerateCode = () => {
    setLoading(true);
    setTimeout(() => {
      setShowCode(true);
      setLoading(false);
    }, 800);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard
      .writeText(code)
      .then(() =>
        toast({
          title: "Copied to clipboard",
          description: "The code has been copied to your clipboard.",
        }),
      )
      .catch(() =>
        toast({
          title: "Failed to copy",
          description: "Please try again or copy manually.",
          variant: "destructive",
        }),
      );
  };

  const generateEmbedScript = () => {
    if (
      selectedCreators.length === 0 &&
      initialLocation.lat === 40.7128 &&
      initialLocation.lng === -74.006 &&
      initialLocation.zoom === 9
    ) {
      return `<script src="https://dev.wadzzo.com/widget-script.js"></script>`;
    }

    let params = [];

    // Add creator parameters if selected
    if (selectedCreators.length > 0) {
      selectedCreators.forEach((id) => {
        params.push(`creators[]=${encodeURIComponent(id)}`);
      });
    }

    // Add initial location parameters
    params.push(`lat=${initialLocation.lat}`);
    params.push(`lng=${initialLocation.lng}`);
    params.push(`zoom=${initialLocation.zoom}`);

    return `<script src="https://dev.wadzzo.com/widget-script.js?${params.join("&")}"></script>`;
  };

  return (
    <div className="flex min-h-screen w-full flex-col items-center px-4 py-10">
      <h1 className="text-3xl font-bold text-primary">Embed Map</h1>
      <p className="mt-4 max-w-2xl text-center text-lg">
        Customize your embedded map by selecting specific creators whose
        locations will appear.
      </p>

      <div className="mt-6 w-full max-w-3xl rounded-md bg-gray-100 p-6 shadow-md">
        <h2 className="mb-4 text-xl font-semibold">Select Creators</h2>

        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search creators by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full"
          />
        </div>

        <div className="mb-4 max-h-[300px] overflow-auto rounded-md bg-white p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading creators...</span>
            </div>
          ) : search ? (
            searchResults.length > 0 ? (
              searchResults.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center space-x-2 border-b p-2"
                >
                  <Checkbox
                    id={creator.id}
                    checked={selectedCreators.includes(creator.id)}
                    onCheckedChange={() => toggleCreator(creator.id)}
                  />
                  <label
                    htmlFor={creator.id}
                    className="flex cursor-pointer items-center space-x-2"
                  >
                    {creator.profileUrl && (
                      <img
                        src={creator.profileUrl}
                        alt={creator.name}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">{creator.name}</p>
                      {creator.bio && (
                        <p className="truncate text-sm text-gray-500">
                          {creator.bio}
                        </p>
                      )}
                    </div>
                  </label>
                </div>
              ))
            ) : (
              <p className="py-4 text-center text-gray-500">
                No creators found matching &quot;{search}&quot;
              </p>
            )
          ) : creators && creators.length > 0 ? (
            creators.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center space-x-2 border-b p-2"
              >
                <Checkbox
                  id={creator.id}
                  checked={selectedCreators.includes(creator.id)}
                  onCheckedChange={() => toggleCreator(creator.id)}
                />
                <label
                  htmlFor={creator.id}
                  className="flex cursor-pointer items-center space-x-2"
                >
                  {creator.profileUrl && (
                    <img
                      src={creator.profileUrl}
                      alt={creator.name}
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{creator.name}</p>
                    {creator.bio && (
                      <p className="truncate text-sm text-gray-500">
                        {creator.bio}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-gray-500">
              No creators available
            </p>
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            {selectedCreators.length === 0
              ? "No creators selected. All public pins will be shown."
              : `${selectedCreators.length} creator${selectedCreators.length > 1 ? "s" : ""} selected. Only their pins will be displayed.`}
          </p>
        </div>

        <div className="mb-6 rounded-md bg-white p-4">
          <div className="mb-4 flex items-center">
            <Map className="mr-2 h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium">Initial Map Location</h3>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label
                htmlFor="latitude"
                className="mb-1 block text-sm font-medium"
              >
                Latitude
              </Label>
              <Input
                id="latitude"
                type="number"
                step="0.0001"
                value={initialLocation.lat}
                onChange={(e) =>
                  setInitialLocation((prev) => ({
                    ...prev,
                    lat: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full"
              />
            </div>
            <div>
              <Label
                htmlFor="longitude"
                className="mb-1 block text-sm font-medium"
              >
                Longitude
              </Label>
              <Input
                id="longitude"
                type="number"
                step="0.0001"
                value={initialLocation.lng}
                onChange={(e) =>
                  setInitialLocation((prev) => ({
                    ...prev,
                    lng: parseFloat(e.target.value) || 0,
                  }))
                }
                className="w-full"
              />
            </div>
          </div>

          <div className="mb-2">
            <Label
              htmlFor="zoom-level"
              className="mb-1 block text-sm font-medium"
            >
              Zoom Level: {initialLocation.zoom}
            </Label>
            <Slider
              id="zoom-level"
              min={1}
              max={20}
              step={1}
              value={[initialLocation.zoom]}
              onValueChange={(values) =>
                setInitialLocation((prev) => ({
                  ...prev,
                  zoom: values[0] ?? prev.zoom,
                }))
              }
              className="py-4"
            />
            <div className="mt-1 flex justify-between text-xs text-gray-500">
              <span>World View</span>
              <span>Street Level</span>
            </div>
          </div>

          <div className="mt-2 text-xs text-gray-600">
            <p>
              Set the initial map position and zoom level. Default is New York
              City.
            </p>
            <p>
              Tip: You can find coordinates for any location using{" "}
              <a
                href="https://www.google.com/maps"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Maps
              </a>{" "}
              - right-click on a location and select "What's here?"
            </p>
          </div>
        </div>

        <Button
          onClick={handleGenerateCode}
          className="w-full"
          disabled={loading}
        >
          {loading && <Loader className="mr-2 h-4 w-4 animate-spin" />}
          Generate Embed Code
        </Button>
      </div>

      {showCode && (
        <div className="mt-6 w-full max-w-3xl rounded-md bg-gray-100 p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold">Embed Code</h2>

          <div className="mb-4">
            <p className="text-sm font-medium">
              1. Copy the following script tag:
            </p>
            <div className="relative mt-2">
              <pre className="overflow-x-auto rounded-md bg-gray-200 p-3 text-sm">
                <code>{generateEmbedScript()}</code>
              </pre>
              <Button
                variant="outline"
                size="sm"
                className="absolute right-2 top-2"
                onClick={() => handleCopyCode(generateEmbedScript())}
              >
                Copy
              </Button>
            </div>
          </div>

          <p className="mt-4 text-sm font-medium">
            2. Paste it into the <code>&lt;head&gt;</code> or{" "}
            <code>&lt;body&gt;</code> of your HTML file.
          </p>

          <p className="mt-4 text-sm font-medium">
            3. Add the following container where you want the map to appear:
          </p>

          <div className="relative mt-2">
            <pre className="rounded-md bg-gray-200 p-3 text-sm">
              <code>{`<div id="map-container"></div>`}</code>
            </pre>
            <Button
              variant="outline"
              size="sm"
              className="absolute right-2 top-2"
              onClick={() => handleCopyCode('<div id="map-container"></div>')}
            >
              Copy
            </Button>
          </div>

          <p className="mt-4 text-sm font-medium">
            4. The map will automatically render inside the container.
          </p>
        </div>
      )}
    </div>
  );
}
