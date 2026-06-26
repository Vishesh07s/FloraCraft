import React from 'react'
export default function AvailabilityToggle({ value, onChange }){
  return (
    <select value={value} onChange={e=>onChange(e.target.value)}>
      <option value="">Any Availability</option>
      <option value="true">In Stock</option>
      <option value="false">Out of Stock</option>
    </select>
  )
}