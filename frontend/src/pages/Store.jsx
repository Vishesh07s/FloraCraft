import React, { useEffect, useMemo, useState } from 'react'
import { fetchPlants } from '../api.js'
import PlantGrid from '../components/PlantGrid.jsx'
import SearchBar from '../components/SearchBar.jsx'
import CategoryFilter from '../components/CategoryFilter.jsx'
import AvailabilityToggle from '../components/AvailabilityToggle.jsx'
import SortBar from '../components/SortBar.jsx'
import Loader from '../components/Loader.jsx'
import ErrorState from '../components/ErrorState.jsx'

const CATEGORIES = ['Indoor','Outdoor','Succulent','Air Purifying','Home Decor','Flowering','Herb','Low Maintenance','Pet Friendly','Hanging']

export default function Store() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [inStock, setInStock] = useState('')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)

  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const params = useMemo(() => ({ q, category, inStock, sort, page, limit: 12 }), [q, category, inStock, sort, page])

  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    const t = setTimeout(() => {
      fetchPlants(params).then(res => { if(active){ setData(res); setLoading(false) } })
                         .catch(e => { if(active){ setError(e.message || 'Failed to load'); setLoading(false) } })
    }, 300)
    return () => { active = false; clearTimeout(t) }
  }, [params.q, params.category, params.inStock, params.sort, params.page])

  return (
    <>
      <div className="controls">
        <SearchBar value={q} onChange={(v)=>{ setPage(1); setQ(v) }} placeholder="Search plants or categories..." />
        <CategoryFilter categories={CATEGORIES} value={category} onChange={(v)=>{ setPage(1); setCategory(v) }} />
        <AvailabilityToggle value={inStock} onChange={(v)=>{ setPage(1); setInStock(v) }} />
        <SortBar value={sort} onChange={(v)=>{ setPage(1); setSort(v) }} />
        <button onClick={() => { setQ(''); setCategory(''); setInStock(''); setSort(''); setPage(1) }}>Reset</button>
      </div>
      {loading ? <Loader/> : error ? <ErrorState message={error}/> : (
        <>
          <PlantGrid items={data.items}/>
          <div className="row" style={{marginTop:'1rem', justifyContent:'space-between'}}>
            <div className="small">{data.total} results</div>
            <div className="row" style={{gap:'0.25rem'}}>
              <button disabled={data.page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
              <div className="badge">Page {data.page} / {data.pages}</div>
              <button disabled={data.page>=data.pages} onClick={()=>setPage(p=>Math.min(data.pages,p+1))}>Next</button>
            </div>
          </div>
        </>
      )}
    </>
  )
}