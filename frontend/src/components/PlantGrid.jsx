import React from 'react'
import PlantCard from './PlantCard.jsx'
export default function PlantGrid({ items }){
  if(!items?.length) return <div className="small">No plants found.</div>
  return <div className="grid">{items.map(p=> <PlantCard key={p._id || p.name+Math.random()} plant={p}/>)}</div>
}