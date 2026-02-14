"use client"

import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Upload } from "@/components/upload";
import { useState } from "react";
import { TrainModelInput } from "common/inferred-types"
import axios from "axios";

import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { BACKEND_URL } from "@/app/config";

// Define types matching the Zod schema
type ModelType = "Man" | "Woman" | "Others";
type Ethnicity = "White" | "Black" | "Asian American" | "East Asian" | "South East Asian" | "South Asian" | "Middle Eastern" | "Pacific" | "Hispanic";
type EyeColor = "Brown" | "Blue" | "Hazel" | "Gray";

export default function Train() {

    const { getToken } = useAuth();

    const [name, setName] = useState("");
    const [zipUrl, setZipUrl] = useState("");
    const [type, setType] = useState<ModelType>("Man");
    const [age, setAge] = useState<number | undefined>();
    const [ethnicity, setEthnicity] = useState<Ethnicity | undefined>();
    const [eyeColor, setEyeColor] = useState<EyeColor | undefined>();
    const [bald, setBald] = useState(false);
    const router = useRouter();

    async function trainModel() {

        if (!age || !ethnicity || !eyeColor || !name) {
            alert("Please fill in all required fields");
            return;
        }

        const input: TrainModelInput = {
            name,
            zipUrl,
            type,
            age,
            ethnicity,
            eyeColor,
            bald
        }

        const token = await getToken();
        const response = await axios.post(`${BACKEND_URL}/ai/training`, input, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log("Training model with input:", input);
        router.push("/")
    }

    return <div className="flex flex-col items-center justify-center h-fit w-full mt-8">
        <Card className="w-150 px-4">
            <CardHeader>
                <CardTitle>Train Your Model</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account
                </CardDescription>
                <CardAction>
                    <Button variant="link">Sign Up</Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                <div className="grid w-full items-center gap-4">
                    
                    <div className="flex gap-4">
                        <div className="grid gap-2 flex-1">
                            <Label htmlFor="name">Name</Label>
                            <Input id="name" type="text" placeholder="Name of the Model" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>

                        <div className="flex flex-col space-y-1.5 flex-1 ">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" placeholder="Age of the model" value={age ?? ''} onChange={(e) => setAge(e.target.value ? parseInt(e.target.value) : undefined)} />
                        </div>
                    </div>

                    <div className="flex gap-4">

                        <div className="flex flex-col space-y-1.5 flex-1">
                            <Label htmlFor="type">Type</Label>
                            <Select value={type} onValueChange={(value) => setType(value as ModelType)}>
                                <SelectTrigger id="name" className="w-full">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>

                                <SelectContent position="popper">
                                    <SelectItem value="Man">Man</SelectItem>
                                    <SelectItem value="Woman"> Woman</SelectItem>
                                    <SelectItem value="Others">Others</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col space-y-1.5 flex-1">
                            <Label htmlFor="ethnicity">Ethnicity</Label>
                            <Select value={ethnicity} onValueChange={(value) => setEthnicity(value as Ethnicity)}>
                                <SelectTrigger id="name" className="w-full">
                                    <SelectValue placeholder="Select" />
                                </SelectTrigger>

                                <SelectContent position="popper">
                                    <SelectItem value="White">White</SelectItem>
                                    <SelectItem value="Black">Black</SelectItem>
                                    <SelectItem value="Asian American">Asian American</SelectItem>
                                    <SelectItem value="East Asian">East Asian</SelectItem>
                                    <SelectItem value="South East Asian">South East Asian</SelectItem>
                                    <SelectItem value="South Asian">South Asian</SelectItem>
                                    <SelectItem value="Middle Eastern">Middle Eastern</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="eyeColor">Eye Color</Label>
                        <Select value={eyeColor} onValueChange={(value) => setEyeColor(value as EyeColor)}>
                            <SelectTrigger id="name" className="w-full">
                                <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent position="popper">
                                <SelectItem value="Brown">Brown</SelectItem>
                                <SelectItem value="Blue">Blue</SelectItem>
                                <SelectItem value="Hazel">Hazel</SelectItem>
                                <SelectItem value="Gray">Gray</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <Label htmlFor="bald">Bald</Label>
                        <Switch checked={bald} onCheckedChange={setBald} />
                    </div>
                    <Upload onUploadDone={(zipUrl) => {
                        setZipUrl(zipUrl)
                    }} />
                </div>

            </CardContent>

            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" onClick={() => { router.push("/") }}>
                    Cancel
                </Button>
                <Button variant="outline" className="w-full" onClick={() => trainModel()} disabled={!zipUrl || !type || !age || !ethnicity || !eyeColor || !name}>
                    Create Model
                </Button>
            </CardFooter>
        </Card>
    </div>
}