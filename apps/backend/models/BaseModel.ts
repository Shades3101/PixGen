export class BaseModel {
    constructor() { }

    protected async generateImage(prompt: string, tensorPath: string): Promise<{ request_id: string; response_url: string; }> {
        throw new Error("Method not implemented.");
    }

    protected async trainModel(zipUrl: string, triggerWord: string): Promise<{ request_id: string; response_url: string; }> {
        throw new Error("Method not implemented.");
    }
}