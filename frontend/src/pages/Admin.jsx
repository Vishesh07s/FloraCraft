import React from 'react'
import AdminForm from '../components/AdminForm.jsx'
import { createPlant } from '../api.js'
export default function Admin(){
  return (
    <section>
      <h2>Admin – Add Plant</h2>
      <p className="small">Validated form with multiple categories.</p>
      <AdminForm onSubmit={async (payload)=>{
        await createPlant(payload)
        alert('Plant created!')
      }}/>
    </section>
  )
}