import { useEffect, useState } from 'react'
import { getMovies, getPosters, addMovie, updateMovie, deleteMovie, uploadPoster } from '../api.js'
import { posterUrl } from '../utils.js'

const EMPTY_FORM = { id: '', title: '', language: 'Hindi', duration: '', shows: '10:00 AM, 01:30 PM, 07:00 PM', poster: '' }

export default function AdminMovies({ token, showMessage, showError }) {
  const [movies, setMovies] = useState([])
  const [posters, setPosters] = useState([])        // image files already in assets/posters
  const [form, setForm] = useState(EMPTY_FORM)      // form.id is empty when adding a new movie

  useEffect(() => {
    loadAll()
  }, [])

  function loadAll() {
    getMovies().then(setMovies)
    getPosters(token).then(setPosters).catch(showError)
  }

  function change(field, value) {
    setForm({ ...form, [field]: value })
  }

  function startEdit(movie) {
    setForm({
      id: movie.id,
      title: movie.title,
      language: movie.language,
      duration: movie.duration,
      shows: movie.showTimes.join(', '),
      poster: movie.poster,
    })
    window.scrollTo(0, 0)
  }

  function save(e) {
    e.preventDefault()
    const editing = form.id !== ''
    const send = editing ? updateMovie : addMovie
    send(token, form)
      .then(() => {
        showMessage(editing ? 'Movie updated' : 'Movie added')
        setForm(EMPTY_FORM)
        loadAll()
      })
      .catch(showError)
  }

  function remove(movie) {
    if (!window.confirm('Delete "' + movie.title + '"?')) return
    deleteMovie(token, movie.id)
      .then(() => {
        showMessage('Movie deleted')
        loadAll()
      })
      .catch(showError)
  }

  // upload the chosen image and select it as the poster
  function chooseFile(e) {
    const file = e.target.files[0]
    if (!file) return
    const name = file.name.replace(/[^A-Za-z0-9._-]/g, '-')
    uploadPoster(token, file, name)
      .then(() => {
        setForm({ ...form, poster: name })
        showMessage('Poster uploaded: ' + name)
        getPosters(token).then(setPosters)
      })
      .catch(showError)
    e.target.value = ''
  }

  return (
    <div className="admin-grid">
      <table className="table">
        <thead>
          <tr><th></th><th>Movie</th><th>Language</th><th>Min</th><th>Show times</th><th></th></tr>
        </thead>
        <tbody>
          {movies.map((movie) => (
            <tr key={movie.id}>
              <td>
                {movie.poster ? <img className="thumb" src={posterUrl(movie.poster)} alt="" /> : <div className="thumb empty" />}
              </td>
              <td>{movie.title}</td>
              <td>{movie.language}</td>
              <td>{movie.duration}</td>
              <td>{movie.showTimes.join(', ')}</td>
              <td className="actions">
                <button className="chip" onClick={() => startEdit(movie)}>Edit</button>
                <button className="chip danger" onClick={() => remove(movie)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form className="panel" onSubmit={save}>
        <h3>{form.id === '' ? 'Add movie' : 'Edit movie'}</h3>

        <label>Title</label>
        <input value={form.title} onChange={(e) => change('title', e.target.value)} />

        <label>Language</label>
        <input list="languages" value={form.language} onChange={(e) => change('language', e.target.value)} />
        <datalist id="languages">
          <option value="Hindi" />
          <option value="English" />
          <option value="Marathi" />
          <option value="Tamil" />
          <option value="Telugu" />
        </datalist>

        <label>Duration (minutes)</label>
        <input type="number" value={form.duration} onChange={(e) => change('duration', e.target.value)} />

        <label>Show times (separate with commas)</label>
        <input value={form.shows} onChange={(e) => change('shows', e.target.value)} />

        <label>Poster</label>
        <select value={form.poster} onChange={(e) => change('poster', e.target.value)}>
          <option value="">No poster</option>
          {posters.map((name) => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>
        <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseFile} />
        <p className="muted">png, jpg, webp or gif, up to 3 MB. You can also copy files into backend/assets/posters.</p>
        {form.poster && <img className="preview" src={posterUrl(form.poster)} alt="poster preview" />}

        <button className="btn">{form.id === '' ? 'Add movie' : 'Save changes'}</button>
        {form.id !== '' && (
          <button type="button" className="link-btn" onClick={() => setForm(EMPTY_FORM)}>Cancel edit</button>
        )}
      </form>
    </div>
  )
}
