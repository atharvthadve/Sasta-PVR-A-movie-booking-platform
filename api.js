// All calls to the Java server are here.

async function callServer(url, options) {
  const response = await fetch(url, options)
  const data = await response.json()
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data
}

export function getMovies() {
  return callServer('/api/movies')
}

export function getSeats(movieId, show) {
  return callServer('/api/seats?movieId=' + movieId + '&show=' + encodeURIComponent(show))
}

export function getBill(movieId, seatIds) {
  return callServer('/api/bill?movieId=' + movieId + '&seats=' + seatIds.join(','))
}

export function bookTicket(details) {
  return callServer('/api/book', { method: 'POST', body: new URLSearchParams(details) })
}

export function findTickets(text) {
  return callServer('/api/tickets?q=' + encodeURIComponent(text))
}

export function getSummary() {
  return callServer('/api/summary')
}

// ---------- admin ----------
// every admin call sends the login token in a header

function adminCall(token, url, options) {
  const settings = options || {}
  settings.headers = { 'X-Admin-Token': token }
  return callServer(url, settings)
}

function post(token, url, data) {
  return adminCall(token, url, { method: 'POST', body: new URLSearchParams(data) })
}

export function adminLogin(password) {
  return callServer('/api/admin/login', { method: 'POST', body: new URLSearchParams({ password }) })
}

export function adminLogout(token) {
  return post(token, '/api/admin/logout', {})
}

export function getAdminPrices(token, movieId) {
  return adminCall(token, '/api/admin/prices?movieId=' + movieId)
}

export function savePrices(token, prices) {
  return post(token, '/api/admin/prices', prices)
}

export function addMovie(token, movie) {
  return post(token, '/api/admin/movie/add', movie)
}

export function updateMovie(token, movie) {
  return post(token, '/api/admin/movie/update', movie)
}

export function deleteMovie(token, id) {
  return post(token, '/api/admin/movie/delete', { id })
}

export function getAdminTickets(token) {
  return adminCall(token, '/api/admin/tickets')
}

export function getPosters(token) {
  return adminCall(token, '/api/admin/posters')
}

// the image file itself is sent as the request body
export function uploadPoster(token, file, name) {
  return adminCall(token, '/api/admin/upload?name=' + encodeURIComponent(name), { method: 'POST', body: file })
}
