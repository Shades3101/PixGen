import express from "express";
import cors from "cors";
import { authRoute } from "./routes/AuthRouter";
import { aiRoute } from "./routes/AiRotuer";
import { webhookRoute } from "./routes/webhookRotuer";
import { uploadRoute } from "./routes/uploadRouter";

const PORT = Number(process.env.PORT ?? 8080);

const app = express();

// Health check endpoint for Render / uptime monitors (must be before CORS)
app.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok"
    });
});

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));

app.use(express.json())

app.use("/", authRoute);
app.use("/", aiRoute);
app.use("/", webhookRoute);
app.use("/", uploadRoute);

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on ${PORT}`);
})
