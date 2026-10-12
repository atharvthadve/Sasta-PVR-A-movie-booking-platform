import { useState } from 'react'
import { posterUrl } from '../utils.js'

// poster colours, one for each movie (we have no poster images)
const POSTER_COLORS = [
  ['#ff7e5f', '#feb47b'],
  ['#1d2b64', '#6a82fb'],
  ['#11998e', '#38ef7d'],
  ['#8e2de2', '#4a00e0'],
  ['#cb2d3e', '#ef473a'],
]

export default function MovieList({ movies, onBook }) {
  const [filter, setFilter] = useState('All')

  const languages = ['All', ...new Set(movies.map((m) => m.language))]
  const shown = movies.filter((m) => filter === 'All' || m.language === filter)

  return (
    <div>
      <div className="title-row">
        <h2>Now showing</h2>
        <div className="filters">
          {languages.map((lang) => (
            <button
              key={lang}
              className={filter === lang ? 'chip active' : 'chip'}
              onClick={() => setFilter(lang)}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="movie-grid">
        {shown.map((movie) => {
          const colors = POSTER_COLORS[(movie.id - 1) % POSTER_COLORS.length]
          const image = posterUrl(movie.poster)
          // poster image if the admin added one, otherwise a colour gradient
          const posterStyle = image
            ? {
                backgroundImage: 'linear-gradient(transparent 55%, rgba(0,0,0,0.8)), url("' + image + '")',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: 'cover',
              }
            : { background: 'linear-gradient(135deg, ' + colors[0] + ', ' + colors[1] + ')' }
          return (
            <div className="movie-card" key={movie.id} onClick={() => onBook(movie)}>
              <div className="poster" style={posterStyle}>
                {!image && <span>{movie.title}</span>}
              </div>
              <div className="movie-info">
                <h3>{movie.title}</h3>
                <p>{movie.language} · {movie.duration} min</p>
                <button className="btn small">Book tickets</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
