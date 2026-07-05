import React from 'react'
export default function SearchBar({ value, onChange }){
  return <input value={value} onChange={e=>onChange(e.target.value)} aria-label="search"/>
}