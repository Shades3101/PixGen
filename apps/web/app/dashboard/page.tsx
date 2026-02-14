import GenerateImage from "@/components/GenerateImage"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Train from "@/components/Train"
import Packs from "@/components/Packs"
import Camera from "@/components/Camera"

export default function Dashboard() {
    return <div className="flex justify-center">
        <div className="max-w-6xl">
            <div className="flex justify-center">
                <Tabs defaultValue="camera">
                    <div className="flex justify-center">
                        <TabsList>
                            <TabsTrigger className="cursor-pointer" value="camera">Camera</TabsTrigger>
                            <TabsTrigger className="cursor-pointer" value="generate">Generate Image</TabsTrigger>
                            <TabsTrigger className="cursor-pointer" value="train">Train a Model</TabsTrigger>
                            <TabsTrigger className="cursor-pointer" value="packs">Packs</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="generate"> <GenerateImage /></TabsContent>
                    <TabsContent value="train"> <Train /> </TabsContent>
                    <TabsContent value="packs"> <Packs /> </TabsContent>
                    <TabsContent value="camera"> <Camera /> </TabsContent>
                </Tabs>
            </div>
        </div>
    </div>
}