import { useRouter } from 'next/router'

export default function LinkPage() {
  const router = useRouter()
  const { slug } = router.query
  const waNumber = '+5491112345678' // TODO: reemplazar por número real de la línea
  const waMessage = `Hola! Vengo de la página ${slug}`

  function goWhatsApp() {
    const url = `https://wa.me/${waNumber.replace(/\D/g,'')}?text=${encodeURIComponent(waMessage)}`
    window.location.href = url
  }

  return (
    <div className="container" style={{textAlign:'center'}}>
      <h1>{process.env.NEXT_PUBLIC_APP_NAME} – {slug}</h1>
      <p>Esta es tu landing simple. El botón envía al WhatsApp con mensaje prellenado.</p>
      <button className="btn" onClick={goWhatsApp}>CREAR USUARIO</button>
      <footer>
        <small>© {new Date().getFullYear()} {process.env.NEXT_PUBLIC_APP_NAME}</small>
      </footer>
    </div>
  )
}
