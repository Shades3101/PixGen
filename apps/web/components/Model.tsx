"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Skeleton } from "./ui/skeleton";

interface TModel {
    id: string,
    thumbnail: string,
    name: string
}

export function SelectModel({ selectedModel, setSelectedModel }: {
    selectedModel: string | undefined;
    setSelectedModel: (model: string | undefined) => void;
}) {
    const [models, setModels] = useState<TModel[]>([]);
    const [modelLoading, setModelLoading] = useState(true)
    const { getToken } = useAuth();

    useEffect(() => {
        (async () => {
            const token = await getToken();
            const response = await axios.get(`${BACKEND_URL}/models`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            })
            setModels(response.data.models);
            setSelectedModel(response.data.models[0]?.id)
            setModelLoading(false);
        })();
    }, [])

    return <div>
        <div className="text-2xl max-w-4xl">
            Select Model
        </div>
        <div className="max-w-2xl">
            <div className="grid grid-cols-4 gap-2 p-2">

                {models.map(model => <div key={model.id} className={`${selectedModel === model.id ? "border-red-300" : ""} border p-2 rounded-md w-full`} onClick={() => {
                    setSelectedModel(model.id)
                }}>
                    <img className="rounded-xl cursor-pointer" src={model.thumbnail} />
                    {model.name}
                </div>)}
            </div>

            {modelLoading && <div className="flex gap-2 p-4">
                <Skeleton className="h-40 w-37.5 rounded" />
                <Skeleton className="h-40 w-37.5 rounded" />
                <Skeleton className="h-40 w-37.5 rounded" />
                <Skeleton className="h-40 w-37.5 rounded" />
            </div>}
        </div>
    </div>
}