"use client";

import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, } from '@clerk/nextjs'
import { Button } from "./ui/button"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info } from "lucide-react"

export function Hero() {

    const router = useRouter();

    return <div className="flex justify-center">
        <div className="max-w-6xl ">
            <div className="pb-8 pt-8">
                <Alert variant="destructive">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Heads up!</AlertTitle>
                    <AlertDescription>
                        We are currently migrating our GPU infrastructure from Fal.ai to Modal.com. Image generation is temporarily unavailable.
                    </AlertDescription>
                </Alert>
            </div>
            <h1 className="text-8xl p-2 text-center pb-4">
                Generate Images for yourself and your loved ones
            </h1>
            <Carousel>
                <CarouselContent>
                    <CarouselItem className="basis-1/3">
                        <img className="w-full h-80 object-cover rounded-xl" src={'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=3088&auto=format&fit=crop'} alt="AI Generated 1" />
                    </CarouselItem>
                    <CarouselItem className="basis-1/3">
                        <img className="w-full h-80 object-cover rounded-xl" src={'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=2550&auto=format&fit=crop'} alt="AI Generated 2" />
                    </CarouselItem>
                    <CarouselItem className="basis-1/3">
                        <img className="w-full h-80 object-cover rounded-xl" src={'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?q=80&w=3000&auto=format&fit=crop'} alt="AI Generated 3" />
                    </CarouselItem>
                    <CarouselItem className="basis-1/3">
                        <img className="w-full h-80 object-cover rounded-xl" src={'https://images.unsplash.com/photo-1581338834647-b0fb40704e21?q=80&w=3087&auto=format&fit=crop'} alt="AI Generated 4" />
                    </CarouselItem>
                    <CarouselItem className="basis-1/3">
                        <img className="w-full h-80 object-cover rounded-xl" src={'https://images.unsplash.com/photo-1566753323558-f4e0952af115?q=80&w=3021&auto=format&fit=crop'} alt="AI Generated 5" />
                    </CarouselItem>
                </CarouselContent>
                <CarouselPrevious />
                <CarouselNext />
            </Carousel>
            <div className="flex justify-center ">
                <SignedIn>
                    <Button onClick={() => { router.push("/dashboard") }} className="mt-4 px-16 py-6" variant={'secondary'} size={'lg'}>
                        Dashboard
                    </Button>
                </SignedIn>

                <SignedOut>
                    <SignInButton >
                        <Button className="mt-4 px-16 py-6" variant={'secondary'} size={'lg'}>
                            Sign In
                        </Button>
                    </SignInButton>
                </SignedOut>
            </div>
        </div>
    </div>
}

