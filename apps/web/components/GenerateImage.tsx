"use client"

import { useState } from "react";
import { Button } from "./ui/button";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { SelectModel } from "./Model";
import { Textarea } from "./ui/textarea";


export default function GenerateImage() {
    const [prompt, setPrompt] = useState("");
    const [selectedModel, setSelectedModel] = useState<string>();
    const { getToken } = useAuth();



    return <div className="h-[60vh] flex items-center justify-center">
        <div>
            <SelectModel selectedModel={selectedModel} setSelectedModel={setSelectedModel} />

            <div className="flex justify-center ">
                <Textarea onChange={(e) => {
                    setPrompt(e.target.value);
                }} placeholder="Describe the image that you'd like to see here" className="py-4 px-4 w-2xl border border-blue-200 hover:border-blue-300 focus:border-blue-300 outline-none"></Textarea>

            </div>
            <div className="flex justify-center pt-4">
                <Button onClick={async () => {
                    const token = await getToken();
                    await axios.post(`${BACKEND_URL}/ai/generate`, {
                        prompt,
                        modelId: selectedModel,
                        num: 1
                    }, {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    })
                    //alert here
                }} variant={"secondary"}> Generate Image</Button>
            </div>

        </div>
    </div>
}


