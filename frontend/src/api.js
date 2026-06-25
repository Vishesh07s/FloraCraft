export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';
export async function fetchPlants(params={}){
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${API_BASE}/api/plants?${qs}`);
  if(!res.ok) throw new Error('Failed to fetch plants');
  return res.json();
}
export async function createPlant(payload){
  const res = await fetch(`${API_BASE}/api/plants`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if(!res.ok) throw new Error(data?.errors?.[0]?.msg || data?.error || 'Failed to create plant');
  return data;
}