import { useEffect, useState } from 'react'
import { getMovies, getAdminPrices, savePrices } from '../api.js'

export default function AdminPricing({ token, showMessage, showError }) {
  const [movies, setMovies] = useState([])
  const [movieId, setMovieId] = useState('')
  const [prices, setPrices] = useState(null)

  useEffect(() => {
    getMovies().then((list) => {
      setMovies(list)
      if (list.length > 0) setMovieId(list[0].id)
    })
  }, [])

  // load the prices of the chosen movie
  useEffect(() => {
    if (movieId === '') return
    getAdminPrices(token, movieId).then(setPrices).catch(showError)
  }, [movieId])

  function change(field, value) {
    setPrices({ ...prices, [field]: value })
  }

  function save(e) {
    e.preventDefault()
    savePrices(token, { ...prices, movieId })
      .then((saved) => {
        setPrices(saved)
        showMessage('Prices saved')
      })
      .catch(showError)
  }

  if (!prices) return null

  const corner = Number(prices.corner)

  return (
    <div className="admin-grid">
      <form className="panel" onSubmit={save}>
        <h3>Seat prices</h3>

        <label>Movie</label>
        <select value={movieId} onChange={(e) => setMovieId(e.target.value)}>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>

        <label>Front rows (A - C)</label>
        <input type="number" value={prices.front} onChange={(e) => change('front', e.target.value)} />

        <label>Middle rows (D - F)</label>
        <input type="number" value={prices.middle} onChange={(e) => change('middle', e.target.value)} />

        <label>Balcony rows (G - H)</label>
        <input type="number" value={prices.balcony} onChange={(e) => change('balcony', e.target.value)} />

        <label>Corner seat extra (added to the row price)</label>
        <input type="number" value={prices.corner} onChange={(e) => change('corner', e.target.value)} />

        <label>GST % (same for all movies)</label>
        <input type="number" step="0.5" value={prices.gst} onChange={(e) => change('gst', e.target.value)} />

        <button className="btn">Save prices</button>
      </form>

      <div className="panel">
        <h3>What customers will pay</h3>
        <table className="table">
          <thead><tr><th>Zone</th><th>Normal seat</th><th>Corner seat</th></tr></thead>
          <tbody>
            <tr><td>Front</td><td>₹{prices.front}</td><td>₹{Number(prices.front) + corner}</td></tr>
            <tr><td>Middle</td><td>₹{prices.middle}</td><td>₹{Number(prices.middle) + corner}</td></tr>
            <tr><td>Balcony</td><td>₹{prices.balcony}</td><td>₹{Number(prices.balcony) + corner}</td></tr>
          </tbody>
        </table>
        <p className="muted">GST of {prices.gst}% is added on top. These prices are only for the selected movie. Tickets that are already booked keep the price they were bought at.</p>
      </div>
    </div>
  )
}
