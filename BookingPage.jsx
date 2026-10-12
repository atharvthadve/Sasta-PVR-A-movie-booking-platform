import { useEffect, useState } from 'react'
import { getSeats, getBill, bookTicket } from '../api.js'
import { rupees } from '../utils.js'
import Theatre3D from './Theatre3D.jsx'

const MAX_SEATS = 8

export default function BookingPage({ movie, onBooked, onBack }) {
  const [showTime, setShowTime] = useState(movie.showTimes[0])
  const [hall, setHall] = useState(null)          // seats from the server
  const [selected, setSelected] = useState([])    // ids like "D5"
  const [bill, setBill] = useState(null)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  // load the seats again whenever the show time changes
  useEffect(() => {
    setSelected([])
    getSeats(movie.id, showTime).then(setHall)
  }, [movie, showTime])

  // ask the server for the bill whenever seats change
  useEffect(() => {
    getBill(movie.id, selected).then(setBill)
  }, [selected])

  function toggleSeat(id) {
    setMessage('')
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id))
    } else if (selected.length >= MAX_SEATS) {
      setMessage('You can select only ' + MAX_SEATS + ' seats')
    } else {
      setSelected([...selected, id])
    }
  }

  function confirmBooking(e) {
    e.preventDefault()
    bookTicket({
      movieId: movie.id,
      show: showTime,
      name: name,
      phone: phone,
      seats: selected.join(','),
    })
      .then(onBooked)
      .catch((err) => {
        setMessage(err.message)
        getSeats(movie.id, showTime).then(setHall)     // refresh in case someone took the seat
      })
  }

  function seatPrice(id) {
    return hall.seats.find((s) => s.id === id).price
  }

  return (
    <div className="booking">
      <div className="booking-left">
        <button className="link-btn" onClick={onBack}>← All movies</button>
        <h2>{movie.title}</h2>

        <div className="show-times">
          {movie.showTimes.map((time) => (
            <button
              key={time}
              className={time === showTime ? 'chip active' : 'chip'}
              onClick={() => setShowTime(time)}
            >
              {time}
            </button>
          ))}
        </div>

        {hall && (
          <Theatre3D
            seats={hall.seats}
            cols={hall.cols}
            selected={selected}
            onToggle={toggleSeat}
            title={movie.title}
            poster={movie.poster}
          />
        )}
      </div>

      <form className="booking-right" onSubmit={confirmBooking}>
        <h3>Your booking</h3>
        <p className="muted">{movie.title} · {showTime}</p>

        {selected.length === 0 ? (
          <p className="muted">Click on seats in the theatre to select them.</p>
        ) : (
          <div className="seat-list">
            {selected.map((id) => (
              <span className="seat-tag" key={id} onClick={() => toggleSeat(id)} title="Click to remove">
                {id} <small>{rupees(seatPrice(id))}</small> ×
              </span>
            ))}
          </div>
        )}

        {bill && (
          <div className="bill">
            <div className="bill-row"><span>Seats</span><span>{rupees(bill.subtotal)}</span></div>
            <div className="bill-row"><span>GST ({bill.gstPercent}%)</span><span>{rupees(bill.gst)}</span></div>
            <div className="bill-row total"><span>Total</span><span>{rupees(bill.total)}</span></div>
          </div>
        )}

        <input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          placeholder="Phone number (10 digits)"
          value={phone}
          maxLength={10}
          onChange={(e) => setPhone(e.target.value)}
        />

        {message && <p className="error">{message}</p>}

        <button className="btn" disabled={selected.length === 0}>Confirm booking</button>
      </form>
    </div>
  )
}
