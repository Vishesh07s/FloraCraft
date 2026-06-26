import React from 'react'
import { PLANT_IMAGE_MAP } from './imageMap.js'
export default function PlantCard({ plant }){
  const fallback = PLANT_IMAGE_MAP[plant.name] || 'https://source.unsplash.com/featured/?houseplant,green,foliage'
  const src = plant.image || fallback
  return (
    <div className="card">
      <img src={src} alt={plant.name}/>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div style={{fontWeight:700}}>{plant.name}</div>
        <div className="price">₹{plant.price}</div>
      </div>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="stack">{plant.categories?.map((c,i)=><span key={i} className="badge">{c}</span>)}</div>
        <span className={plant.available ? 'badge ok':'badge err'}>{plant.available?'In Stock':'Out of Stock'}</span>
      </div>
      <div className="small">⭐ {Number(plant.rating).toFixed(1)}</div>
    </div>
  )
}