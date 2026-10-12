import { rupees } from '../utils.js'

// shows one booked ticket with its bill
export default function TicketCard({ ticket }) {
  return (
    <div className="ticket">
      <div className="ticket-top">
        <div>
          <div className="small-text">{ticket.type} ticket</div>
          <h3>{ticket.movie}</h3>
          <div className="small-text">{ticket.show}</div>
        </div>
        <div className="ticket-code">{ticket.code}</div>
      </div>

      <div className="ticket-body">
        <p className="small-text">{ticket.name} · {ticket.phone}</p>

        <div className="seat-list">
          {ticket.seats.map((seat) => (
            <span className="seat-tag" key={seat.id}>
              {seat.id} <small>{seat.zone} · {rupees(seat.price)}</small>
            </span>
          ))}
        </div>

        <div className="bill-row"><span>Seats</span><span>{rupees(ticket.subtotal)}</span></div>
        <div className="bill-row"><span>GST</span><span>{rupees(ticket.gst)}</span></div>
        <div className="bill-row total"><span>Total</span><span>{rupees(ticket.total)}</span></div>
      </div>
    </div>
  )
}
