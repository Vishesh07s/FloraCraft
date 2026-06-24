import { Router } from "express";
import { Plant } from "../models/Plant.js";
import { body, validationResult } from "express-validator";
const router = Router();

router.get("/", async (req,res,next)=>{
  try{
    const { q="", category="", inStock="", sort="", page=1, limit=12 } = req.query;
    const filters = {};
    if(q){
      const regex = new RegExp(q, "i");
      filters.$or = [{ name: regex }, { categories: regex }];
    }
    if(category) filters.categories = category;
    if(inStock==="true" || inStock==="false") filters.available = inStock==="true";
    const sortMap = {
      price_asc: { price: 1 },
      price_desc: { price: -1 },
      name_asc: { name: 1 },
      name_desc: { name: -1 }
    };
    const sortOption = sortMap[sort] || { createdAt: -1 };
    const pageNum = Math.max(parseInt(page)||1,1);
    const limitNum = Math.min(Math.max(parseInt(limit)||12,1), 60);

    const [items,total] = await Promise.all([
      Plant.find(filters).sort(sortOption).skip((pageNum-1)*limitNum).limit(limitNum),
      Plant.countDocuments(filters)
    ]);
    res.json({ items, total, page: pageNum, pages: Math.ceil(total/limitNum) });
  }catch(e){ next(e); }
});

router.post("/",
  body("name").isString().trim().isLength({min:2,max:80}),
  body("price").isFloat({min:0}),
  body("categories").isArray({min:1}),
  body("categories.*").isString().trim().isLength({min:2,max:40}),
  body("available").optional().isBoolean(),
  body("image").optional().isString(),
  body("rating").optional().isFloat({min:0,max:5}),
  async (req,res,next)=>{
    try{
      const errors = validationResult(req);
      if(!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
      const plant = await Plant.create(req.body);
      res.status(201).json(plant);
    }catch(e){ next(e); }
  }
);
export default router;