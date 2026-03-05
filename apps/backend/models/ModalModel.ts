export class ModalModel {

    private baseUrl: string;
    private webhookBaseUrl: string;
    private devSuffix: string;

    constructor() {

        // MODAL_BASE_URL should be e.g. "https://naraniakaran--pixgen-gpu"
        this.baseUrl = process.env.MODAL_BASE_URL!;
        this.webhookBaseUrl = process.env.WEBHOOK_BASE_URL!;

        // In dev mode (modal serve), URLs have a "-dev" suffix
        this.devSuffix = process.env.MODAL_DEV === "true" ? "-dev" : "";
    }

    /** Build the full Modal web endpoint URL for a given function name */
    private endpointUrl(fnName: string): string {
        // Modal pattern for this app: https://{user}--pixgen-gpu-{function}[-dev].modal.run
        return `${this.baseUrl}-${fnName}${this.devSuffix}.modal.run`;
    }

    public async trainModel(
        zipUrl: string,
        triggerWord: string,
        modelId: string,
        modelDetails: {
            type: string;
            age: number;
            ethnicity: string;
            eyeColor: string;
            bald: boolean;
        }
    ) {

        const response = await fetch(this.endpointUrl("train"), {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                zipUrl,
                triggerWord,
                modelId,
                modelDetails,
                webhookUrl: `${this.webhookBaseUrl}/modal/webhook/train`,
            }),
        });

        if (!response.ok) {
            throw new Error(`Modal Training Request Failed: ${response.status}`);
        }
        return response.json(); // {status, modelId}
    }

    public async generateImage(prompt: string, modelId: string, imageId: string) {

        const response = await fetch(this.endpointUrl("generate"), {

            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt,
                modelId,
                imageId,
                webhookUrl: `${this.webhookBaseUrl}/modal/webhook/image`,
            }),
        });

        if (!response.ok) {
            throw new Error(`Modal Generation Request Failed: ${response.status}`);
        }
        return response.json(); // {status, imageId}
    }
}