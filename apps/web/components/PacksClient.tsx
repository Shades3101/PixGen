"use client";

import { useState } from "react";
import { SelectModel } from "./Model";
import PackCard, { TPack } from "./PackCard";

export function PacksClient({ packs }: {
    packs: TPack[]
}) {

    const [selectedModelId, setSelectedModelId] = useState<string>()

    return <>
        <SelectModel setSelectedModel={setSelectedModelId} selectedModel={selectedModelId} />
        <div className="grid md:grid-cols-3 gap-4 p-4 cursor-pointer grid-cols-1">
            {packs.map(p => <PackCard selectedModelId={selectedModelId ?? ""} key={p.id} {...p} />)}
        </div>
    </>
}