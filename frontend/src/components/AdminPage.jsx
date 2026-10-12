import { useState } from 'react'
import { adminLogin, adminLogout } from '../api.js'
import AdminMovies from './AdminMovies.jsx'
import AdminPricing from './AdminPricing.jsx'
import AdminBookings from './AdminBookings.jsx'

export default function AdminPage({ token, setToken }) {
  const [tab, setTab] = useState('movies')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState({ text: '', good: false })

  function login(e) {
    e.preventDefault()
    adminLogin(password)
      .then((data) => {
        setToken(data.token)
        setPassword('')
        setMessage({ text: '', good: false })
      })
      .catch((err) => setMessage({ text: err.message, good: false }))
  }

  function logout() {
    adminLogout(token).catch(() => {})
    setToken('')
  }

  // child pages call these two to show a message on top
  function showMessage(text) {
    setMessage({ text: text, good: true })
  }

  function showError(err) {
    if (err.message === 'Admin login required') {
      setToken('')                 // token not valid any more (server restarted)
    }
    setMessage({ text: err.message, good: false })
  }

  if (!token) {
    return (
      <form className="center login-box" onSubmit={login}>
        <h2>Admin login</h2>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {message.text && <p className="error">{message.text}</p>}
        <button className="btn">Login</button>
      </form>
    )
  }

  return (
    <div>
      <div className="title-row">
        <h2>Admin panel</h2>
        <div className="filters">
          <button className={tab === 'movies' ? 'chip active' : 'chip'} onClick={() => setTab('movies')}>Movies</button>
          <button className={tab === 'pricing' ? 'chip active' : 'chip'} onClick={() => setTab('pricing')}>Pricing</button>
          <button className={tab === 'bookings' ? 'chip active' : 'chip'} onClick={() => setTab('bookings')}>Bookings</button>
          <button className="chip" onClick={logout}>Logout</button>
        </div>
      </div>

      {message.text && <p className={message.good ? 'success' : 'error'}>{message.text}</p>}

      {tab === 'movies' && <AdminMovies token={token} showMessage={showMessage} showError={showError} />}
      {tab === 'pricing' && <AdminPricing token={token} showMessage={showMessage} showError={showError} />}
      {tab === 'bookings' && <AdminBookings token={token} showError={showError} />}
    </div>
  )
}
