import { useState } from 'react'
import { findTickets } from '../api.js'
import TicketCard from './TicketCard.jsx'

export default function FindTicket() {
  const [text, setText] = useState('')
  const [tickets, setTickets] = useState(null)      // null = not searched yet

  function search(e) {
    e.preventDefault()
    findTickets(text).then(setTickets)
  }

  return (
    <div className="center">
      <h2>Find your ticket</h2>
      <form className="search-box" onSubmit={search}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Ticket code (SP0001) or phone number"
        />
        <button className="btn">Search</button>
      </form>

      {tickets && tickets.length === 0 && <p className="muted">No ticket found.</p>}
      {tickets && tickets.map((t) => <TicketCard key={t.code} ticket={t} />)}
    </div>
  )
}
