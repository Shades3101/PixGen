"use client"

import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { useEffect, useState } from "react";
import ImageCard, { ImageCardSkeleton, TImage } from "./ImageCard"; 

export default function Camera() {

    const [images, setImages] = useState<TImage[]>([]);
    const [imagesLoading, setImagesLoading] = useState(true);
    const { getToken } = useAuth();

    useEffect(() => {
        (async () => {
            const token = await getToken();
            const response = await axios.get(`${BACKEND_URL}/image/bulk`, {
                headers: {
                    "Authorization" : `Bearer ${token}`
                }
            })
            setImages(response.data.images);
            setImagesLoading(false);
        })


    }, [])

    return <div className="grid md:grid-cols-4 grid-cols-1 gap-2">
        {images.map(image => <ImageCard {...image} /> )}
        {imagesLoading && <ImageCardSkeleton/>  }
    </div>
}

