import React, { useState } from 'react'
const empty = { name:'', price:'', categories:'', available:true, image:'', rating:4.5 }
export default function AdminForm({ onSubmit }){
  const [form,setForm] = useState(empty)
  const [busy,setBusy] = useState(false)
  function set(k,v){ setForm(prev=>({...prev,[k]:v})) }
  async function handle(e){
    e.preventDefault()
    if(!form.name.trim() || Number(form.price)<0 || !form.categories.trim()){
      alert('Please fill Name, non-negative Price, and Categories'); return
    }
    const payload = {
      name: form.name.trim(),
      price: Number(form.price),
      categories: form.categories.split(',').map(s=>s.trim()).filter(Boolean),
      available: Boolean(form.available),
      image: form.image?.trim(),
      rating: Number(form.rating) || 0
    }
    setBusy(True)
  }
  return (
    <form className="form" onSubmit={(e)=>{
      e.preventDefault()
      if(!form.name.trim() || Number(form.price)<0 || !form.categories.trim()){
        alert('Please fill Name, non-negative Price, and Categories'); return
      }
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        categories: form.categories.split(',').map(s=>s.trim()).filter(Boolean),
        available: Boolean(form.available),
        image: form.image?.trim(),
        rating: Number(form.rating) || 0
      }
      setBusy(true)
      Promise.resolve(onSubmit(payload)).then(()=>{ setForm(empty) }).finally(()=> setBusy(false))
    }}>
      <input placeholder="Name *" value={form.name} onChange={e=>set('name',e.target.value)}/>
      <input placeholder="Price (₹) *" type="number" value={form.price} onChange={e=>set('price',e.target.value)}/>
      <input className="full" placeholder="Categories (comma separated) *" value={form.categories} onChange={e=>set('categories',e.target.value)}/>
      <input placeholder="Image URL" className="full" value={form.image} onChange={e=>set('image',e.target.value)}/>
      <select value={form.available} onChange={e=>set('available', e.target.value==='true')}>
        <option value="true">Available</option>
        <option value="false">Out of Stock</option>
      </select>
      <input placeholder="Rating (0-5)" type="number" min="0" max="5" step="0.1" value={form.rating} onChange={e=>set('rating',e.target.value)}/>
      <div className="full"><button disabled={busy} type="submit">{busy?'Saving...':'Add Plant'}</button></div>
    </form>
  )
}