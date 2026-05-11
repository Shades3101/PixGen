"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Card } from "@/components/ui/card";
import { Camera, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";

interface TImage {
    id: string;
    status: string;
    imageUrl: string;
}

const CameraTab = () => {
    const [images, setImages] = useState<TImage[]>([]);
    const [loading, setLoading] = useState(true);
    const { getToken } = useAuth();

    const fetchImages = async () => {
        try {
            const token = await getToken();
            const response = await axios.get(`${BACKEND_URL}/image/bulk`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setImages(response.data.images);
        } catch (e) {
            console.error("Failed to fetch images:", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchImages();
        // Poll every 5 seconds to auto-update when images finish generating
        const interval = setInterval(fetchImages, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                <h2 className="text-xl font-bold uppercase tracking-tight">Your Generations</h2>
                <Link href="/dashboard?tab=generate">
                    <button className="bg-primary text-primary-foreground uppercase font-bold tracking-widest text-xs px-6 py-3 cursor-pointer hover:bg-foreground hover:text-background transition-colors">
                        New Generation
                    </button>
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {loading &&
                    Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="aspect-square border-harsh bg-secondary p-2">
                            <Skeleton className="w-full h-full rounded" />
                        </Card>
                    ))}

                {!loading && images.length === 0 && (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                        <Camera size={48} />
                        <p className="label-mono">No images generated yet</p>
                        <Link href="/dashboard?tab=generate">
                            <button className="bg-primary text-primary-foreground uppercase font-bold tracking-widest text-xs px-6 py-3 cursor-pointer">
                                Generate Your First Image
                            </button>
                        </Link>
                    </div>
                )}

                {images.map((image) => (
                    <Card key={image.id} className="group relative aspect-square overflow-hidden border-harsh bg-secondary">
                        {image.status === "Generated" ? (
                            <img
                                src={image.imageUrl}
                                alt="Generated"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : image.status === "Failed" ? (
                            <div className="w-full h-full flex flex-col items-center justify-center text-red-500/80 p-4 text-center space-y-2">
                                <div className="p-2 rounded-full bg-red-500/10 mb-1">
                                    <AlertTriangle size={20} className="text-red-500" />
                                </div>
                                <p className="label-mono text-[10px] uppercase font-bold text-red-500">Generation Failed</p>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center">
                                <div className="text-center space-y-3">
                                    <div className="relative mx-auto w-12 h-12">
                                        <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin" />
                                    </div>
                                    <p className="label-mono text-[10px]">Generating...</p>
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default CameraTab;
