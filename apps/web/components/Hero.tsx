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

export function Hero() {

    const router = useRouter();

    return <div className="flex justify-center">
        <div className="max-w-6xl ">
            <h1 className="text-8xl p-2 text-center pb-4">
                Generate Images for yourself and your loved ones
            </h1>
            <Carousel>
                <CarouselContent>
                    <CarouselItem className="basis-1/3">
                        <img className="w-max-[400px]" src={'https://www.cdc.gov/healthy-pets/media/images/2024/04/Cat-on-couch.jpg'} />
                    </CarouselItem>
                    <CarouselItem className="basis-1/3">
                        <img className="w-max-[400px]" src={'https://www.cdc.gov/healthy-pets/media/images/2024/04/Cat-on-couch.jpg'} />
                    </CarouselItem>
                    <CarouselItem className="basis-1/3">
                        <img className="w-max-[400px]" src={'https://www.cdc.gov/healthy-pets/media/images/2024/04/Cat-on-couch.jpg'} />
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

//Change images in this
