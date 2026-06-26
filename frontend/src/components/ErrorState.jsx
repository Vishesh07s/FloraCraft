import React from 'react'
export default function ErrorState({message='Something went wrong.'}){ return <div className='small' style={{color:'var(--error)'}}>⚠ {message}</div> }