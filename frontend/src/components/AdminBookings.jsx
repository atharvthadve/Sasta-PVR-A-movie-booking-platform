import { useEffect, useState } from 'react'
import { getAdminTickets } from '../api.js'
import { rupees } from '../utils.js'

export default function AdminBookings({ token, showError }) {
  const [tickets, setTickets] = useState(null)       // null = still loading
  const [filter, setFilter] = useState('')

  useEffect(() => {
    getAdminTickets(token).then(setTickets).catch(showError)
  }, [])

  if (!tickets) return null

  const text = filter.toLowerCase()
  const shown = tickets.filter((t) =>
    (t.code + ' ' + t.name + ' ' + t.phone + ' ' + t.movie).toLowerCase().includes(text)
  )

  let revenue = 0
  tickets.forEach((t) => {
    revenue = revenue + t.total
  })

  return (
    <div>
      <div className="stats">
        <div className="stat"><span>{tickets.length}</span> tickets</div>
        <div className="stat"><span>{rupees(revenue)}</span> collected</div>
      </div>

      <input
        className="filter-input"
        placeholder="Filter by code, name, phone or movie"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <table className="table">
        <thead>
          <tr><th>Code</th><th>Type</th><th>Movie</th><th>Show</th><th>Customer</th><th>Seats</th><th>Total</th></tr>
        </thead>
        <tbody>
          {shown.map((t) => (
            <tr key={t.code}>
              <td>{t.code}</td>
              <td>{t.type}</td>
              <td>{t.movie}</td>
              <td>{t.show}</td>
              <td>{t.name}<br /><span className="muted">{t.phone}</span></td>
              <td>{t.seats.map((s) => s.id).join(', ')}</td>
              <td>{rupees(t.total)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {shown.length === 0 && <p className="muted">No bookings found.</p>}
    </div>
  )
}
