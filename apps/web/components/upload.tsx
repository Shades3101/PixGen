"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import axios from "axios";
import { BACKEND_URL, CLOUDFLARE_URL } from "@/app/config";
import { useState } from "react";
import JSZip from "jszip";

export function Upload({ onUploadDone }: { onUploadDone: (zipUrl: string) => void }) {
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center rounded-lg p-10 space-y-6">
        <CloudUploadIcon className="w-16 h-16 text-zinc-500 dark:text-zinc-400" />
        <Button variant="outline" className="w-full" disabled={isUploading} onClick={() => {
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "image/*";
          input.multiple = true;
          input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files || files.length === 0) return;

            setIsUploading(true);
            const newImages: string[] = [];

            for (const file of files) {
              newImages.push(URL.createObjectURL(file));
            }
            setImages(newImages);

            try {
              const zip = new JSZip();
              const res = await axios.get(`${BACKEND_URL}/pre-signed-url`);
              const url = res.data.url;
              const key = res.data.key;

              for (const file of files) {
                const content = await file.arrayBuffer();
                zip.file(file.name, content);
              }

              const content = await zip.generateAsync({ type: "blob" });

              await axios.put(url, content, {
                headers: {
                  'Content-Type': 'application/zip'
                },
                onUploadProgress: (progressEvent) => {
                  if (progressEvent.total) {
                    console.log(`Upload Progress: ${Math.round((progressEvent.loaded * 100) / progressEvent.total)}%`);
                  }
                }
              });

              onUploadDone(`${CLOUDFLARE_URL}/${key}`);
            } catch (e) {
              console.error("Upload failed:", e);
              alert("Upload failed. Please try again.");
            } finally {
              setIsUploading(false);
            }
          }
          input.click();
        }}>
          {isUploading ? "Uploading..." : "Select Files"}
        </Button>

        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full mt-4">
            {images.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-md overflow-hidden border">
                <img src={src} alt="Preview" className="object-cover w-full h-full" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CloudUploadIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round" >
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M12 12v9" />
      <path d="m16 16-4-4-4 4" />
    </svg>
  )
}