import { useState } from 'react'
import Link from 'next/link'

export default function NewPage() {
  const [slug, setSlug] = useState('mi-slug')
  const [message, setMessage] = useState('Hola! Vengo de la campaña.')

  return (
    <div className="container">
      <h2>Nueva Página</h2>
      <div className="card">
        <label>Ruta (slug)</label>
        <input className="input" value={slug} onChange={e=>setSlug(e.target.value)} />
        <label style={{marginTop:12}}>Mensaje de WhatsApp</label>
        <input className="input" value={message} onChange={e=>setMessage(e.target.value)} />
        <p style={{marginTop:12}}>
          <Link className="btn" href={`/link/${slug}`}>Previsualizar</Link>
        </p>
      </div>
    </div>
  )
}


