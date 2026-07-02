import express from "express";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import plantsRouter from "./routes/plants.js";

dotenv.config();
const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (_,res)=>res.json({status:"ok"}));
app.use("/api/plants", plantsRouter);
app.use((err,req,res,next)=>{ console.error(err); res.status(500).json({ error: err.message || "Server error" }); });

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/floracraft_plants";
connectDB(MONGO_URI).then(()=>app.listen(PORT,()=>console.log(`🚀 http://localhost:${PORT}`)));