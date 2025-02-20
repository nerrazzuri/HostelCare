import { useState } from 'react';
import QRCode from 'qrcode';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Plus, Trash } from "lucide-react";

interface Location {
  id: string;
  name: string;
  qrCode?: string;
}

export function QRCodeGenerator() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [newLocation, setNewLocation] = useState('');

  const generateQRCode = async (location: string) => {
    try {
      const qrData = JSON.stringify({ location });
      const qrCode = await QRCode.toDataURL(qrData);
      return qrCode;
    } catch (err) {
      console.error('Error generating QR code:', err);
      return null;
    }
  };

  const addLocation = async () => {
    if (!newLocation.trim()) return;
    
    const qrCode = await generateQRCode(newLocation);
    const newLoc: Location = {
      id: Date.now().toString(),
      name: newLocation,
      qrCode,
    };
    
    setLocations([...locations, newLoc]);
    setNewLocation('');
  };

  const removeLocation = (id: string) => {
    setLocations(locations.filter(loc => loc.id !== id));
  };

  const downloadQRCode = (location: Location) => {
    if (!location.qrCode) return;
    
    const link = document.createElement('a');
    link.href = location.qrCode;
    link.download = `qr-${location.name.toLowerCase().replace(/\s+/g, '-')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code Generator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <Label htmlFor="location">Location Name</Label>
            <Input
              id="location"
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value)}
              placeholder="Enter location name"
            />
          </div>
          <Button 
            className="mt-auto"
            onClick={addLocation}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Location
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {locations.map((location) => (
            <Card key={location.id}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-4">{location.name}</h3>
                  {location.qrCode && (
                    <div className="mb-4">
                      <img
                        src={location.qrCode}
                        alt={`QR code for ${location.name}`}
                        className="mx-auto"
                      />
                    </div>
                  )}
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQRCode(location)}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeLocation(location.id)}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
