import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/router'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login')
  const [error, setError] = useState('')
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (mode === 'login') {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return setError(error.message)
      router.push('/projects')
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) return setError(error.message)
      alert('Revisa tu email para confirmar la cuenta.')
    }
  }

  return (
    <div className="container">
      <h1>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h1>
      <form onSubmit={handleSubmit} className="card">
        <input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <br/>
        <input className="input" type="password" placeholder="Contraseña" value={password} onChange={e=>setPassword(e.target.value)} />
        <br/>
        <button className="btn" type="submit">{mode === 'login' ? 'Entrar' : 'Registrarme'}</button>
        <span style={{marginLeft:12}}>
          <button className="btn secondary" onClick={()=>setMode(mode==='login'?'signup':'login')} type="button">
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
        </span>
        {error && <p style={{color:'crimson'}}>{error}</p>}
      </form>
    </div>
  )
}


