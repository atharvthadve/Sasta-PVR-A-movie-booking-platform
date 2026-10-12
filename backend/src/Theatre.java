import java.util.Arrays;

// Theatre class, stores movies and tickets in arrays and does booking
public class Theatre {

    private Movie[] movies = new Movie[50];
    private int movieCount = 0;
    private int nextMovieId = 1;

    private Ticket[] tickets = new Ticket[200];
    private int ticketCount = 0;

    private String error = "";

    public Theatre() {
        addSampleData();
    }

    public Movie addMovie(String title, String language, int duration, String[] showTimes, String poster) {
        error = checkMovie(title, language, duration, showTimes);
        if (!error.isEmpty()) {
            return null;
        }
        if (movieCount == movies.length) {
            error = "Movie list is full";
            return null;
        }
        Movie movie = new Movie(nextMovieId, title, language, duration, showTimes, poster);
        nextMovieId++;
        movies[movieCount] = movie;
        movieCount++;
        return movie;
    }

    public boolean updateMovie(int id, String title, String language, int duration,
                               String[] showTimes, String poster) {
        Movie movie = findMovie(id);
        error = (movie == null) ? "Movie not found" : checkMovie(title, language, duration, showTimes);
        if (!error.isEmpty()) {
            return false;
        }
        movie.setTitle(title);
        movie.setLanguage(language);
        movie.setDuration(duration);
        movie.setShowTimes(showTimes);
        movie.setPoster(poster);
        return true;
    }

    public boolean setMoviePrices(int id, int front, int middle, int balcony, int corner) {
        Movie movie = findMovie(id);
        if (movie == null || !movie.setPrices(front, middle, balcony, corner)) {
            error = (movie == null) ? "Movie not found"
                    : "Seat prices must be between 1 and 5000 (corner extra up to 1000)";
            return false;
        }
        return true;
    }

    // movie with booked tickets cannot be deleted
    public boolean deleteMovie(int id) {
        for (int i = 0; i < ticketCount; i++) {
            if (tickets[i].getMovie().getId() == id) {
                error = "Cannot delete: tickets are already booked for this movie";
                return false;
            }
        }
        for (int i = 0; i < movieCount; i++) {
            if (movies[i].getId() == id) {
                for (int k = i; k < movieCount - 1; k++) {
                    movies[k] = movies[k + 1];
                }
                movieCount--;
                movies[movieCount] = null;
                return true;
            }
        }
        error = "Movie not found";
        return false;
    }

    private String checkMovie(String title, String language, int duration, String[] showTimes) {
        if (title == null || title.trim().isEmpty()) {
            return "Movie title cannot be empty";
        }
        if (language == null || language.trim().isEmpty()) {
            return "Language cannot be empty";
        }
        if (duration < 1 || duration > 600) {
            return "Duration must be between 1 and 600 minutes";
        }
        if (showTimes.length == 0) {
            return "Add at least one show time like 07:00 PM";
        }
        for (int i = 0; i < showTimes.length; i++) {
            if (!showTimes[i].matches("(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)")) {
                return "Wrong show time \"" + showTimes[i] + "\" (use format 07:00 PM)";
            }
        }
        return "";
    }

    public static String[] parseShowTimes(String text) {
        if (text == null || text.trim().isEmpty()) {
            return new String[0];
        }
        String[] parts = text.split(",");
        for (int i = 0; i < parts.length; i++) {
            parts[i] = parts[i].trim().toUpperCase();
            if (parts[i].matches("[1-9]:[0-5][0-9] (AM|PM)")) {
                parts[i] = "0" + parts[i];
            }
        }
        return parts;
    }

    public Movie[] getMovies() {
        return Arrays.copyOf(movies, movieCount);
    }

    public Movie findMovie(int id) {
        for (int i = 0; i < movieCount; i++) {
            if (movies[i].getId() == id) {
                return movies[i];
            }
        }
        return null;
    }

    // is this seat already booked?
    public boolean isTaken(int movieId, String showTime, String seatId) {
        for (int i = 0; i < ticketCount; i++) {
            Ticket t = tickets[i];
            if (t.getMovie().getId() != movieId || !t.getShowTime().equalsIgnoreCase(showTime)) {
                continue;
            }
            for (int j = 0; j < t.getSeatCount(); j++) {
                if (t.getSeat(j).getId().equalsIgnoreCase(seatId)) {
                    return true;
                }
            }
        }
        return false;
    }

    public Seat[] makeSeats(Movie movie, String[] seatIds) {
        if (seatIds.length == 0 || seatIds.length > 8) {
            error = "Select 1 to 8 seats";
            return null;
        }
        Seat[] seats = new Seat[seatIds.length];
        for (int i = 0; i < seatIds.length; i++) {
            String id = seatIds[i].trim().toUpperCase();
            seats[i] = id.matches("[A-H]([1-9]|10)")
                    ? new Seat(id.charAt(0), Integer.parseInt(id.substring(1)), movie) : null;
            if (seats[i] == null) {
                error = "Invalid seat: " + seatIds[i];
                return null;
            }
            for (int j = 0; j < i; j++) {
                if (seats[j].getId().equals(id)) {
                    error = "Seat " + id + " selected twice";
                    return null;
                }
            }
        }
        return seats;
    }

    // returns null if booking fails, reason is in getError()
    public Ticket book(int movieId, String showTime, String name, String phone, String[] seatIds) {
        Movie movie = findMovie(movieId);
        if (movie == null || !movie.hasShow(showTime)) {
            error = "Movie or show time not found";
        } else if (ticketCount == tickets.length) {
            error = "Sorry, all tickets are sold out";
        } else if (!Customer.isValidName(name)) {
            error = "Please enter a valid name";
        } else if (!Customer.isValidPhone(phone)) {
            error = "Phone number must be 10 digits";
        } else {
            error = "";
        }
        if (!error.isEmpty()) {
            return null;
        }

        Seat[] seats = makeSeats(movie, seatIds);
        if (seats == null) {
            return null;
        }
        for (int i = 0; i < seats.length; i++) {
            if (isTaken(movieId, showTime, seats[i].getId())) {
                error = "Seat " + seats[i].getId() + " is already booked";
                return null;
            }
        }

        Ticket ticket = new Ticket(movie, new Customer(name, phone), showTime);
        for (int i = 0; i < seats.length; i++) {
            ticket.addSeat(seats[i]);
        }
        tickets[ticketCount] = ticket;
        ticketCount++;
        return ticket;
    }

    public String getError() {
        return error;
    }

    public Ticket[] getTickets() {
        return Arrays.copyOf(tickets, ticketCount);
    }

    public Ticket[] search(String text, boolean byName) {
        text = text.trim();
        Ticket[] found = new Ticket[ticketCount];
        int count = 0;
        for (int i = 0; i < ticketCount; i++) {
            Ticket t = tickets[i];
            boolean match = t.getTicketCode().equalsIgnoreCase(text)
                    || t.getCustomer().getPhone().equals(text)
                    || (byName && t.getCustomer().getName().equalsIgnoreCase(text));
            if (match) {
                found[count] = t;
                count++;
            }
        }
        return Arrays.copyOf(found, count);
    }

    public double getTotalRevenue() {
        double total = 0;
        for (int i = 0; i < ticketCount; i++) {
            total = total + tickets[i].calculateBill();
        }
        return Math.round(total * 100) / 100.0;
    }

    public int getTicketCount() {
        return ticketCount;
    }

    private void addSampleData() {
        String[] times = { "10:00 AM", "01:30 PM", "07:00 PM" };
        addMovie("Hanuman Ansh", "Hindi", 150, times, "hanuman ansh.jpg");
        addMovie("Interstellar", "English", 169, times, "intersteller banner.jpg");
        addMovie("Drishyam 3", "Hindi", 163, times, "drishyam.jpg");
    }
}
