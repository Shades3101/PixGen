"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { ImagePlus, Wand2, Loader2, Key } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface TModel {
    id: string;
    name: string;
    type?: string;
    thumbnail: string;
    trainingStatus: string;
    triggerWord?: string;
}

const GenerateTab = () => {
    const [prompt, setPrompt] = useState("");
    const [selectedModel, setSelectedModel] = useState<string>();
    const [models, setModels] = useState<TModel[]>([]);
    const [modelsLoading, setModelsLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [generated, setGenerated] = useState(false);
    const { getToken } = useAuth();

    useEffect(() => {
        (async () => {
            try {
                const token = await getToken();

                const response = await axios.get(`${BACKEND_URL}/models`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const readyModels = response.data.models.filter(
                    (m: TModel) => m.trainingStatus === "Generated"
                );

                setModels(readyModels);

                if (readyModels.length > 0) {
                    setSelectedModel(readyModels[0].id);
                }

            } catch (e) {
                console.error("Failed to fetch models:", e);

            } finally {
                setModelsLoading(false);
            }
        })();
    }, []);

    const handleGenerate = async () => {

        if (!prompt || !selectedModel) {
            return;
        }

        setGenerating(true);
        setGenerated(false);

        try {
            const token = await getToken();
            const model = models.find(m => m.id === selectedModel);
            const triggerWord = model?.triggerWord;
            
            // Prompt is structured to match DreamBooth training format:
            // "a photo of {trigger_word} {type}, {user prompt}, highly detailed, sharp focus"
            // This ensures the LoRA activates correctly and style adherence is maximised.
            const subjectType = model?.type?.toLowerCase() ?? "person";
            const finalPrompt = (triggerWord && !prompt.includes(triggerWord))
                ? `a photo of ${triggerWord} ${subjectType}, ${prompt}, highly detailed, sharp focus`
                : prompt;

            await axios.post(`${BACKEND_URL}/ai/generate`,{ 
                prompt: finalPrompt, 
                modelId: selectedModel,
                num: 1 
            }, { 
                headers: { 
                    Authorization: `Bearer ${token}`
                }
            });

            setGenerated(true);

        } catch (e) {
            console.error("Generation failed:", e);
            alert("Image generation failed. Please try again.");

        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <Card className="p-6 border-harsh bg-secondary space-y-6">
                    <div className="space-y-2">
                        <Label className="label-mono">Your Prompt</Label>
                        <Textarea
                            placeholder="A futuristic portrait of a cybernetic warrior..."
                            className="min-h-[150px] border-harsh bg-background resize-none focus-visible:ring-primary"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label className="label-mono">Select Model</Label>
                        {modelsLoading ? (
                            <div className="grid grid-cols-2 gap-2">
                                {[1, 2].map((i) => (
                                    <Skeleton key={i} className="h-24 rounded" />
                                ))}
                            </div>
                        ) : models.length === 0 ? (
                            <div className="p-4 border-harsh bg-background text-center">
                                <p className="text-xs text-muted-foreground">No trained models available.</p>
                                <p className="text-[10px] label-mono mt-1">Train a model first in the Train tab.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-2 gap-2">
                                    {models.map((model) => (
                                        <div key={model.id} onClick={() => setSelectedModel(model.id)}
                                            className={`p-2 border cursor-pointer transition-all ${selectedModel === model.id
                                                ? "border-primary bg-primary/10"
                                                : "border-border hover:border-foreground/30"
                                                }`}
                                        >
                                            {model.thumbnail && (
                                                <img src={model.thumbnail} alt={model.name} className="w-full aspect-square object-cover mb-2" />
                                            )}
                                            <p className="text-xs font-bold uppercase tracking-tight truncate">{model.name}</p>
                                        </div>
                                    ))}
                                </div>
                                {selectedModel && (
                                    <div className="mt-4 p-3 border-harsh bg-background rounded-sm space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] label-mono uppercase text-muted-foreground">Trigger Word</span>
                                            <Badge variant="outline" className="text-[10px] font-mono border-primary/30 text-primary">
                                                {models.find(m => m.id === selectedModel)?.triggerWord || "N/A"}
                                            </Badge>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground leading-relaxed italic">
                                            The model is active. Your trigger word will be added automatically!
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    <Button onClick={handleGenerate} disabled={!prompt || !selectedModel || generating}
                        className="w-full bg-primary text-primary-foreground font-bold uppercase tracking-[0.2em] py-6 h-auto disabled:opacity-40"
                    >
                        {generating ? (
                            <><Loader2 className="mr-2 animate-spin" size={18} /> Generating...</>
                        ) : (
                            <><Wand2 className="mr-2" size={18} /> Generate Image</>
                        )}
                    </Button>
                </Card>
            </div>

            <div className="lg:col-span-2">
                <div className="aspect-[4/3] border-2 border-dashed border-border bg-secondary flex flex-col items-center justify-center text-muted-foreground gap-4">
                    {generated ? (
                        <div className="text-center space-y-3 flex flex-col items-center">
                            <div className="p-4 rounded-full bg-primary/10 border border-primary/30 inline-block">
                                <Wand2 size={48} className="text-primary" />
                            </div>
                            <p className="font-bold uppercase tracking-widest text-sm text-primary">Generation Triggered!</p>
                            <p className="text-xs label-mono max-w-xs mb-4">
                                Your image is being generated. Check the Camera tab to see it once ready.
                            </p>
                            <a href="/dashboard?tab=camera">
                                <Button className="bg-primary text-primary-foreground uppercase font-bold tracking-widest text-xs">
                                    Go to Camera
                                </Button>
                            </a>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 rounded-full bg-background border-harsh">
                                <ImagePlus size={48} className="text-muted-foreground" />
                            </div>
                            <div className="text-center">
                                <p className="font-bold uppercase tracking-widest text-sm mb-1">Preview Area</p>
                                <p className="text-xs label-mono">Your generated image will appear here</p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GenerateTab;
