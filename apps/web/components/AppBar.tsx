import { ClerkProvider, SignInButton, SignUpButton, SignedIn, SignedOut, UserButton, } from '@clerk/nextjs'
import { Button } from './ui/button'

export function AppBar() {

    return <div className='flex justify-between p-2 border-b'>
        <div className='text-xl'>
            PhotoAI
        </div>
        <div>
            <SignedOut>

                <SignInButton>
                    <Button className="font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 cursor-pointer" variant={"default"}>
                        Sign In
                    </Button>
                </SignInButton>

            </SignedOut>
            <SignedIn>
                <UserButton />
            </SignedIn>
        </div>
    </div>
}

