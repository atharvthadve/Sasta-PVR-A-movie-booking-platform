import { useEffect, useState } from 'react'
import { getMovies, getSummary } from './api.js'
import MovieList from './components/MovieList.jsx'
import BookingPage from './components/BookingPage.jsx'
import TicketCard from './components/TicketCard.jsx'
import FindTicket from './components/FindTicket.jsx'
import AdminPage from './components/AdminPage.jsx'

// the admin panel has its own address: /admin (no link to it on the public pages)
const isAdminRoute = window.location.pathname === '/admin'

export default function App() {
  const [page, setPage] = useState('movies')      // movies, booking, ticket or find
  const [movies, setMovies] = useState([])
  const [movie, setMovie] = useState(null)
  const [ticket, setTicket] = useState(null)
  const [summary, setSummary] = useState(null)
  const [serverError, setServerError] = useState('')
  const [adminToken, setAdminToken] = useState('')     // empty = not logged in

  // load the movies again on every page change, so admin changes show up
  useEffect(() => {
    getMovies()
      .then(setMovies)
      .catch(() => setServerError('Cannot reach the Java server. Start ApiServer first (see README).'))
    loadSummary()
  }, [page])

  function loadSummary() {
    getSummary().then(setSummary).catch(() => {})
  }

  function openBooking(selectedMovie) {
    setMovie(selectedMovie)
    setPage('booking')
  }

  function ticketBooked(newTicket) {
    setTicket(newTicket)
    setPage('ticket')
    loadSummary()
  }

  function goHome() {
    window.location.href = '/'
  }

  if (isAdminRoute) {
    return (
      <div className="app">
        <header className="header">
          <h1 className="logo" onClick={goHome}>SASTA<span>PVR</span></h1>
          <button className="nav-btn" onClick={goHome}>← Back to site</button>
        </header>
        <main className="main">
          <AdminPage token={adminToken} setToken={setAdminToken} />
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo" onClick={() => setPage('movies')}>
          SASTA<span>PVR</span>
        </h1>
        <nav>
          <button className={page === 'movies' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('movies')}>
            Movies
          </button>
          <button className={page === 'find' ? 'nav-btn active' : 'nav-btn'} onClick={() => setPage('find')}>
            Find ticket
          </button>
        </nav>
        {summary && <div className="sold">{summary.totalTickets} tickets sold</div>}
      </header>

      <main className="main">
        {serverError && <p className="error">{serverError}</p>}

        {page === 'movies' && <MovieList movies={movies} onBook={openBooking} />}

        {page === 'booking' && (
          <BookingPage movie={movie} onBooked={ticketBooked} onBack={() => setPage('movies')} />
        )}

        {page === 'ticket' && (
          <div className="center">
            <h2>Booking confirmed</h2>
            <TicketCard ticket={ticket} />
            <button className="btn" onClick={() => setPage('movies')}>Book another movie</button>
          </div>
        )}

        {page === 'find' && <FindTicket />}
      </main>
    </div>
  )
}
