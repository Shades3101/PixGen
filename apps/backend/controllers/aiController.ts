import { GenerateImage, GenerateImageFromPack, TrainModel } from "common";
import { EthnicityEnum, prismaClient } from "db";
import { Request, Response } from "express";
import { ModalModel } from "../models/ModalModel";
import { generateTriggerWord } from "../utils/triggerWord";

const modalModel = new ModalModel();

export const AiTraining = async (req: Request, res: Response) => {

    try {
        const parsedBody = TrainModel.safeParse(req.body);

        if (!parsedBody.success) {
            return res.status(411).json({
                message: "Input incorrect"
            })
        }

        const userId = req.userId;

        if (!userId) {
            return res.status(400).json({
                message: "User Missing"
            })
        }

        const triggerWord = generateTriggerWord(parsedBody.data.name);

        const data = await prismaClient.model.create({
            data: {
                name: parsedBody.data.name,
                type: parsedBody.data.type,
                age: parsedBody.data.age,
                ethnicity: parsedBody.data.ethnicity as EthnicityEnum,
                eyeColor: parsedBody.data.eyeColor,
                bald: parsedBody.data.bald,
                userId: userId,
                zipUrl: parsedBody.data.zipUrl,
                triggerWord: triggerWord
            }
        });

        console.log(`Sending training request to Modal for model ${data.id}`);
        console.log(`Modal endpoint called successfully`);

        (async () => {
            try {
                await modalModel.trainModel(parsedBody.data.zipUrl, triggerWord, data.id, {
                    type: parsedBody.data.type,
                    age: parsedBody.data.age,
                    ethnicity: parsedBody.data.ethnicity,
                    eyeColor: parsedBody.data.eyeColor,
                    bald: parsedBody.data.bald,
                });
                console.log(`Modal training request accepted for model ${data.id}`);
            } catch (err) {
                console.error(`Modal training request failed for model ${data.id}:`, err);
            }
        })();

        res.json({
            modelId: data.id
        })
    } catch (error: any) {

        console.error("Training request failed:", error?.message || error);

        res.status(500).json({
            message: "Training request failed",
            error: error?.message || "Unknown error"
        })
    }

}

export const AiGenerate = async (req: Request, res: Response) => {

    const parsedBody = GenerateImage.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const userId = req.userId;

    if (!userId) {
        return res.status(400).json({
            message: "User Missing"
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

    const data = await prismaClient.outputImages.create({
        data: {
            prompt: parsedBody.data.prompt,
            userId: userId,
            modelId: parsedBody.data.modelId,
        }
    });

    (async () => {
        try {
            await modalModel.generateImage(parsedBody.data.prompt, parsedBody.data.modelId, data.id);
            console.log(`Modal generation request accepted for image ${data.id}`);
        } catch (err) {
            console.error(`Modal generation request failed for image ${data.id}:`, err);
        }
    })();

    res.json({
        imageId: data.id
    })
}

export const PackGenerate = async (req: Request, res: Response) => {

    const parsedBody = GenerateImageFromPack.safeParse(req.body);

    if (!parsedBody.success) {
        return res.status(411).json({
            message: "Input incorrect"
        })
    }

    const userId = req.userId;

    if (!userId) {
        return res.status(400).json({
            message: "User Missing"
        })
    }

    const [prompts, model] = await Promise.all([

        prismaClient.packPrompts.findMany({
            where: {
                packId: parsedBody.data.packId
            }
        }),
        prismaClient.model.findFirst({
            where: {
                id: parsedBody.data.modelId
            }
        })
    ]);

    if (!model) {
        return res.status(411).json({
            message: "model not found"
        })
    }

    const images = await prismaClient.outputImages.createManyAndReturn({
        data: prompts.map((prompt: {
            prompt: string
        }) => ({
            prompt: prompt.prompt,
            userId: userId,
            modelId: parsedBody.data.modelId,
        }))
    })

    // Fire all generation requests to Modal in parallel (non-blocking)
    images.forEach((image, index) => {
        (async () => {
            try {
                await modalModel.generateImage(prompts[index]!.prompt, parsedBody.data.modelId, image.id);
                console.log(`Modal generation request accepted for image ${image.id}`);
            } catch (err) {
                console.error(`Modal generation request failed for image ${image.id}:`, err);
            }
        })();
    });

    res.json({
        images: images.map((image: { id: string }) => image.id)
    })

}

export const PackBulk = async (req: Request, res: Response) => {
    const packs = await prismaClient.packs.findMany({})

    res.json({
        packs
    })
};

export const ImageBulk = async (req: Request, res: Response) => {
    const ids = req.query.images as string[]
    const limit = req.query.limit as string ?? "10";
    const offset = req.query.offset as string ?? "0";

    const where: any = {
        userId: req.userId!,
        status: {
            not: "Failed"
        }
    };

    if (ids) {
        where.id = { in: ids };
    }

    const imagesData = await prismaClient.outputImages.findMany({
        where,
        orderBy: {
            createdAt: "desc"
        },
        skip: parseInt(offset),
        take: parseInt(limit)
    })

    res.json({
        images: imagesData
    })
};

export const ModelsBulk = async (req: Request, res: Response) => {
    const models = await prismaClient.model.findMany({
        where: {
            OR: [{ userId: req.userId }, { open: true }]
        }
    })

    res.json({
        models
    })
};