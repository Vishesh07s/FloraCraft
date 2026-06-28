import React from 'react'
export default function SortBar({ value, onChange }){
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">Sort: Newest</option>
      <option value="price_asc">Price ↑</option>
      <option value="price_desc">Price ↓</option>
      <option value="name_asc">Name A–Z</option>
      <option value="name_desc">Name Z–A</option>
    </select>
  )
}