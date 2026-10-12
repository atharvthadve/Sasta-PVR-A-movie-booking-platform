// shows a number as rupees, example: 1500.8 -> ₹1,500.80
export function rupees(amount) {
  const hasPaise = Math.round(amount * 100) % 100 !== 0
  return '₹' + Number(amount).toLocaleString('en-IN', {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })
}

// web address of a poster image ('' if the movie has no poster)
export function posterUrl(fileName) {
  return fileName ? '/assets/posters/' + encodeURIComponent(fileName) : ''
}
