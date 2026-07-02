import React, { useEffect, useMemo, useState } from 'react'
import { fetchPlants } from '../api.js'
import PlantGrid from '../components/PlantGrid.jsx'
import SearchBar from '../components/SearchBar.jsx'
import CategoryFilter from '../components/CategoryFilter.jsx'
import AvailabilityToggle from '../components/AvailabilityToggle.jsx'
import SortBar from '../components/SortBar.jsx'
import Loader from '../components/Loader.jsx'
import ErrorState from '../components/ErrorState.jsx'
import { PLANT_IMAGE_MAP } from '../components/imageMap.js'

const CATEGORIES = ['Indoor','Outdoor','Succulent','Air Purifying','Home Decor','Flowering','Herb','Low Maintenance','Pet Friendly','Hanging']

const getPlantDescription = (plant) => {
  const name = plant.name || '';
  if (name.includes("Snake")) return "The Snake Plant is an incredibly hardy houseplant known for its striking upright leaves. It acts as an excellent air purifier and requires very low maintenance.";
  if (name.includes("Money")) return "The Money Plant is a popular indoor creeper believed to bring good luck and prosperity. Its beautiful heart-shaped leaves grow rapidly and look stunning in hanging baskets.";
  if (name.includes("Lily")) return "The Peace Lily is a gorgeous indoor plant with glossy green leaves and elegant white blooms. It thrives in low light and helps filter indoor air toxins.";
  if (name.includes("Aloe")) return "Aloe Vera is a well-known succulent famous for its soothing gel and medicinal properties. Thriving in bright, indirect sunlight, it needs minimal watering.";
  if (name.includes("Fern")) return "Boston Ferns are lush, feathery plants that bring a touch of woodland elegance indoors. They love high humidity and indirect light, making them perfect for bathrooms.";
  if (name.includes("Palm")) return "Areca Palms are beautiful, tropical houseplants that add an instant vacation vibe to any room. They are highly efficient natural humidifiers and safe for pets.";
  return `The ${name} is a beautiful, hand-selected houseplant from our FloraCraft collection. It adds clean air, vibrant green aesthetics, and natural tranquility to your home or office space.`;
};

export default function Store() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [inStock, setInStock] = useState('')
  const [sort, setSort] = useState('')
  const [page, setPage] = useState(1)

  const [data, setData] = useState({ items: [], total: 0, page: 1, pages: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlant, setSelectedPlant] = useState(null)

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
          <PlantGrid items={data.items} onSelect={(p) => setSelectedPlant(p)}/>
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

      {selectedPlant && (
        <div className="modal-overlay" onClick={() => setSelectedPlant(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={() => setSelectedPlant(null)}>&times;</button>
            <img 
              className="modal-image" 
              src={selectedPlant.image && !selectedPlant.image.includes('source.unsplash.com') ? selectedPlant.image : (PLANT_IMAGE_MAP[selectedPlant.name] || 'https://images.unsplash.com/photo-1597055181300-e3633a207518?auto=format&fit=crop&w=600&q=80')} 
              alt={selectedPlant.name}
            />
            <div className="modal-body">
              <div className="modal-title">{selectedPlant.name}</div>
              <div className="price">₹{selectedPlant.price}</div>
              <div className="small">⭐ {Number(selectedPlant.rating).toFixed(1)}</div>
              <div className="row" style={{flexWrap: 'wrap', gap: '0.25rem'}}>
                {selectedPlant.categories?.map((c, i) => <span key={i} className="badge">{c}</span>)}
                <span className={selectedPlant.available ? 'badge ok' : 'badge err'}>
                  {selectedPlant.available ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
              <div className="modal-desc" style={{marginTop: '0.5rem'}}>
                {getPlantDescription(selectedPlant)}
              </div>
              <button 
                className="modal-action-btn" 
                onClick={() => {
                  alert(`"${selectedPlant.name}" added to cart!`);
                  setSelectedPlant(null);
                }}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}