
import { prismaClient as prisma } from "../index";

async function main() {
    try {
        // Clear existing data
        await prisma.outputImages.deleteMany();
        await prisma.model.deleteMany();
        await prisma.user.deleteMany();
        await prisma.packPrompts.deleteMany();
        await prisma.packs.deleteMany();

        // 1. Create a User
        const user = await prisma.user.create({
            data: {
                id: "user_39cq982OeRdWJfiiWln4Ffmwswn",
                username: "karannarania",
                profilePicture: "https://avatars.githubusercontent.com/u/12345678?v=4",
            },
        });
        console.log(`Created user: ${user.username}`);

        // 2. Create a Model for the User
        const model = await prisma.model.create({
            data: {
                name: "Test Model",
                type: "Man",
                age: 30,
                ethnicity: "White",
                eyeColor: "Blue",
                bald: false,
                userId: user.id,
                zipUrl: "https://example.com/model.zip",
                trainingStatus: "Generated",
                tensorPath: "path/to/tensor",
                thumbnail: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
                triggerWord: "OHWX",
                open: true,
            },
        });
        console.log(`Created model: ${model.name}`);

        // 3. Create generated Output Images for the Model
        await prisma.outputImages.createMany({
            data: [
                {
                    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "A cinematic portrait of a man in a suit",
                    status: "Generated",
                },
                {
                    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "A casual photo of a man at the beach",
                    status: "Generated",
                },
                // Pack 1: Professional Headshots
                {
                    imageUrl: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "A professional headshot of a person wearing a business suit, neutral background, soft lighting, 8k resolution",
                    status: "Generated",
                },
                {
                    imageUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "Corporate portrait, confident expression, office background, high quality",
                    status: "Generated",
                },
                // Pack 2: Fantasy Characters
                {
                    imageUrl: "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=500&auto=format&fit=crop",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "A fantasy elf with glowing eyes and magical aura, forest background",
                    status: "Generated",
                },
                {
                    imageUrl: "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "A brave warrior in silver armor, holding a sword, epic battlefield background",
                    status: "Generated",
                },
                // Pack 3: Cinematic Portraits
                {
                    imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "A cinematic close-up portrait, dramatic side lighting, moody atmosphere, 8k resolution",
                    status: "Generated",
                },
                {
                    imageUrl: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60",
                    modelId: model.id,
                    userId: user.id,
                    prompt: "Film noir style portrait, black and white, mysterious shadow, high contrast",
                    status: "Generated",
                }
            ]
        })
        console.log(`Created output images for model: ${model.name}`);

        // 4. Create Packs and Prompts
        const packs = [
            {
                name: "Professional Headshots",
                description:
                    "Generate high-quality professional headshots suitable for LinkedIn and resumes.",
                imageUrl1:
                    "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHByb2Zlc3Npb25hbCUyMGhlYWRzaG90fGVufDB8fDB8fHww",
                imageUrl2:
                    "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cHJvZmVzc2lvbmFsJTIwaGVhZHNob3R8ZW58MHx8MHx8fDA%3D",
                prompts: [
                    "A professional headshot of a person wearing a business suit, neutral background, soft lighting, 8k resolution",
                    "Corporate portrait, confident expression, office background, high quality",
                    "LinkedIn profile picture, smart casual attire, studio lighting",
                ],
            },
            {
                name: "Fantasy Characters",
                description:
                    "Turn yourself into a fantasy character like an elf, warrior, or mage.",
                imageUrl1:
                    "https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?q=80&w=500&auto=format&fit=crop",
                imageUrl2:
                    "https://images.unsplash.com/photo-1519074069444-1ba4fff66d16?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8ZmFudGFzeXxlbnwwfHwwfHx8MA%3D%3D",
                prompts: [
                    "A fantasy elf with glowing eyes and magical aura, forest background",
                    "A brave warrior in silver armor, holding a sword, epic battlefield background",
                    "A mystical mage casting a spell, dark robes, arcane symbols",
                ],
            },
            {
                name: "Cinematic Portraits",
                description:
                    "Create stunning, movie-like portraits with dramatic lighting and compositions.",
                imageUrl1:
                    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D",
                imageUrl2:
                    "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cG9ydHJhaXR8ZW58MHx8MHx8fDA%3D",
                prompts: [
                    "A cinematic close-up portrait, dramatic side lighting, moody atmosphere, 8k resolution",
                    "Film noir style portrait, black and white, mysterious shadow, high contrast",
                    "Golden hour portrait, warm lighting, lens flare, dreamy bokeh background",
                ],
            }
        ];

        for (const pack of packs) {
            const createdPack = await prisma.packs.create({
                data: {
                    name: pack.name,
                    description: pack.description,
                    imageUrl1: pack.imageUrl1,
                    imageUrl2: pack.imageUrl2,
                },
            });

            console.log(`Created pack: ${createdPack.name}`);

            for (const prompt of pack.prompts) {
                await prisma.packPrompts.create({
                    data: {
                        prompt: prompt,
                        packId: createdPack.id,
                    },
                });
            }
        }

        console.log("Seeding completed.");
    } catch (error) {
        console.error("Error during seeding:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
