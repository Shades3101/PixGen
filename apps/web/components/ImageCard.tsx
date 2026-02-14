import { Skeleton } from "./ui/skeleton";


export interface TImage {
    id: string;
    status: string;
    imageUrl: string;
}

export default function ImageCard(props: TImage) {

    return <div className="rounded-xl hover:border-red-400 border-2 w-full max-w-sm gap-6 overflow-hidden p-2">
        <div className="flex p-4 gap-4 items-center justify-center">
            {props.status === "Generated" ? (
                <img
                    src={props.imageUrl}
                    alt="Generated Image"
                    className="rounded w-full h-auto object-cover"
                />
            ) : (
                <Skeleton className="rounded h-48 w-full" />
            )}
        </div>
    </div>
}

export function ImageCardSkeleton() {

    return <div className="rounded-xl hover:border-red-400 border-2 w-full max-w-sm gap-6 overflow-hidden">
        <div className="flex gap-4 items-center justify-center p-4">
            <Skeleton className="rounded h-48 w-full" />
        </div>
    </div>
}
