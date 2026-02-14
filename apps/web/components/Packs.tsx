import axios from "axios";
import { TPack } from "./PackCard";
import { PacksClient } from "./PacksClient";
import { BACKEND_URL } from "@/app/config";

async function getPacks(): Promise<TPack[]> {
    const response = await axios.get(`${BACKEND_URL}/pack/bulk`);
    return response.data.packs ?? [];
}


export default async function Packs() {
    const packs = await getPacks();

    return <PacksClient packs={packs} />
}
