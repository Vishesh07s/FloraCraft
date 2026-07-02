import dotenv from "dotenv";
import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);
import { connectDB } from "../db.js";
import { Plant } from "../models/Plant.js";
import fs from "fs"; import path from "path"; import url from "url";
dotenv.config();
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
async function run(){
  const uri = process.env.MONGO_URI || "mongodb://localhost:27017/floracraft_plants";
  await connectDB(uri);
  const raw = fs.readFileSync(path.join(__dirname, "plants.json"), "utf-8");
  const items = JSON.parse(raw);
  await Plant.deleteMany({});
  await Plant.insertMany(items);
  console.log(`✅ Seeded ${items.length} plants.`);
  process.exit(0);
}
run().catch(e=>{ console.error(e); process.exit(1); });