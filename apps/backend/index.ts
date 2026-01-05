import express from "express";
import { TrainModel, GenerateImage, GenerateImageFromPack } from "../../packages/common/types";
import { prismaClient } from "../../packages/db";

import { S3Client } from "bun";
import { FalAIModel } from "./models/FalAIModel";
import cors from "cors";
import { authMiddleware } from "./middleware";

const USER_ID = "123"

const PORT = process.env.PORT || 8080;

const falAiModel = new FalAIModel();

const app = express();
app.use(cors())
app.use(express.json())

app.get("/pre-signed-url", async (req, res) => {

    const key = `models/${Date.now()}_${Math.random()}.zip`;

    const url = S3Client.presign(key, {
        method: "PUT",
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        endpoint: process.env.ENDPOINT,
        bucket: process.env.BUCKET_NAME,
        expiresIn: 60 * 5,
        type: "application/zip"
    })

    console.log(url)

    res.json({
        url,
        key
    })
})

app.post("/ai/training", authMiddleware, async (req, res) => {
    const parsedBody = TrainModel.safeParse(req.body);
    const images = req.body.images;

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const { request_id, response_url } = await falAiModel.trainModel(parsedBody.data.zipUrl, parsedBody.data.name);

    const data = await prismaClient.model.create({
        data: {
            name: parsedBody.data.name,
            type: parsedBody.data.type,
            age: parsedBody.data.age,
            ethnicity: parsedBody.data.ethnicity,
            eyeColor: parsedBody.data.eyeColor,
            bald: parsedBody.data.bald,
            userId: req.userId!,
            zipUrl: parsedBody.data.zipUrl,
            falAiRequest: request_id,

        }
    })

    res.json({
        modelId: data.id
    })

});

app.post("/ai/generate", authMiddleware, async (req, res) => {
    const parsedBody = GenerateImage.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const model = await prismaClient.model.findUnique({
        where: {
            id: parsedBody.data.modelId
        }
    })

    if (!model || !model.tensorPath) {
        return res.status(411).json({
            message: "Model not found"
        })
    }

    const { request_id, response_url } = await falAiModel.generateImage(parsedBody.data.prompt, model?.tensorPath)

    const data = await prismaClient.outputImages.create({
        data: {
            prompt: parsedBody.data.prompt,
            userId: req.userId!,
            modelId: parsedBody.data.prompt,
            imageUrl: "",
            falAiRequest: request_id
        }
    })

    res.json({
        imageId: data.id
    })
});

app.post("/pack/generate", authMiddleware, async (req, res) => {
    const parsedBody = GenerateImageFromPack.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const prompts = await prismaClient.packPrompts.findMany({
        where: {
            packId: parsedBody.data.packId
        }
    })

    let requestIds: { request_id: string }[] = await Promise.all(prompts.map((prompt: { prompt: string }) => falAiModel.generateImage(prompt.prompt, parsedBody.data.modelId)))

    const images = await prismaClient.outputImages.createManyAndReturn({
        data: prompts.map((prompt: { prompt: string }, index: number) => ({
            prompt: prompt.prompt,
            userId: req.userId!,
            modelId: parsedBody.data.modelId,
            imageUrl: "",
            falAiRequestId: requestIds[index]?.request_id
        }))
    })

    res.json({
        images: images.map((image: { id: string }) => image.id)
    })
});

app.get("/pack/bulk", async (req, res) => {
    const packs = await prismaClient.packs.findMany({})

    res.json({
        packs
    })
});

app.get("/image/bulk", authMiddleware, async (req, res) => {
    const ids = req.query.images as string[]
    const limit = req.query.limit as string ?? "10";
    const offset = req.query.offset as string ?? "0";

    const imagesData = await prismaClient.outputImages.findMany({
        where: {
            id: { in: ids },
            userId: req.userId!
        },
        skip: parseInt(offset),
        take: parseInt(limit)
    })

    res.json({
        images: imagesData
    })
});

app.get("/models", authMiddleware, async (req, res) => {
    const models = await prismaClient.model.findMany({
        where: {
            OR: [{ userId: req.userId }, { open: true }]
        }
    })

    res.json({
        models
    })
})

app.post("/fal-ai/webhook/train", async (req, res) => {
    console.log("/fal-ai/webhook/train")
    console.log(req.body)
    //update the status of the image in db
    const request_id = req.body.request_id;

    const { imageUrl } = await falAiModel.generateImageSync(req.body.tensor_Path)

    await prismaClient.model.updateMany({
        where: {
            falAiRequest: request_id
        },
        data: {
            trainingStatus: "Generated",
            tensorPath: req.body.tensor_Path,
            thumbnail: imageUrl
        }
    })


    res.json({
        message: "Webhook received"
    })
})

app.post("/fal-ai/webhook/image", async (req, res) => {
    console.log("/fal-ai/webhook/image")
    console.log(req.body)
    //update the status of the image in db
    const request_id = req.body.request_id;

    await prismaClient.outputImages.updateMany({
        where: {
            falAiRequest: request_id
        },
        data: {
            status: "Generated",
            imageUrl: req.body.response_url
        }
    })

    res.json({
        message: "Webhook received"
    })
})

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
})