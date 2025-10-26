import Link from 'next/link'

export default function Projects() {
  return (
    <div className="container">
      <h2>Proyectos</h2>
      <div className="card">
        <p>Ejemplo de proyecto: <Link href="/projects/rosario">Rosario</Link></p>
        <p><Link className="btn" href="/app/pages/new">Crear Página</Link></p>
      </div>
    </div>
  )
}


