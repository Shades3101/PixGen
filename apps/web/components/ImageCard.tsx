import { Skeleton } from "./ui/skeleton";


export interface TImage {
    id: string;
    status: string;
    imageUrl: string;
}

export default function ImageCard(props: TImage) {

    return <div className="rounded-xl hover:border-red-400 border-2 max-w-75 gap-6 overflow-hidden p-2">
        <div className="flex p-4 gap-4 items-center justify-center">
            { props.status === "Generated" ? <img src={props.imageUrl} className="rounded" /> : <Skeleton className="rounded  h-40 w-300 " />}
        </div>
    </div>
}

export function ImageCardSkeleton() {

    return <div className="rounded-xl hover:border-red-400 border-2 max-w-75 gap-6 overflow-hidden">
        <div className="flex gap-4 items-center justify-center">
            <Skeleton className="rounded h-100 w-100" /> 
        </div>
    </div>
}
