import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";

export interface TPack {
    id:string;
    name: string;
    imageUrl1: string;
    imageUrl2: string;
    description: string;
}

export default function PackCard(props: TPack & { selectedModelId: string }) {

    const { getToken } = useAuth();

    return <div className="rounded-xl hover:border-red-400 border-2 gap-6 overflow-hidden p-2" onClick={ async () => {
        const token = await getToken();
        await axios.post(`${BACKEND_URL}/pack/generate`, {
            packId: props.id,
            modelId: props.selectedModelId
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        })
    }}>
        <div className="flex p-4 gap-4 items-center justify-center">
            <img src={props.imageUrl1} width="50%" className="rounded" />
            <img src={props.imageUrl2} width="50%" className="rounded" />
        </div>

        <div className="text-xl font-bold pb-2">
            {props.name}
        </div>
        <div className="text-sm">
            {props.description}
        </div>
    </div>
}
