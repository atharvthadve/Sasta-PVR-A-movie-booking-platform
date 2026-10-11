import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URLDecoder;
import java.util.HashMap;

// small web server for the React frontend, uses the same Theatre class
public class ApiServer implements HttpHandler {

    static Theatre theatre = new Theatre();

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(8080), 0);
        server.createContext("/api", new ApiServer());
        server.createContext("/api/admin", new AdminHandler());
        server.createContext("/assets", new AssetHandler());
        server.start();
        System.out.println("Sasta PVR server running on http://localhost:8080");
    }

    public void handle(HttpExchange ex) throws IOException {
        String path = ex.getRequestURI().getPath();
        try {
            HashMap<String, String> params = readParams(ex);

            if (path.equals("/api/movies")) {
                send(ex, 200, moviesJson());
            } else if (path.equals("/api/seats")) {
                send(ex, 200, seatsJson(params));
            } else if (path.equals("/api/bill")) {
                send(ex, 200, billJson(params));
            } else if (path.equals("/api/book")) {
                bookTicket(ex, params);
            } else if (path.equals("/api/tickets")) {
                send(ex, 200, findTicketsJson(params.getOrDefault("q", "")));
            } else if (path.equals("/api/summary")) {
                send(ex, 200, summaryJson());
            } else {
                send(ex, 404, error("Not found"));
            }
        } catch (Exception e) {
            send(ex, 400, error("Bad request"));
        }
    }

    static String moviesJson() {
        Movie[] movies = theatre.getMovies();
        String json = "[";
        for (int i = 0; i < movies.length; i++) {
            Movie m = movies[i];
            String times = "";
            for (int j = 0; j < m.getShowTimes().length; j++) {
                times += (j > 0 ? "," : "") + q(m.getShowTimes()[j]);
            }
            json += (i > 0 ? "," : "") + "{\"id\":" + m.getId() + ",\"title\":" + q(m.getTitle())
                    + ",\"language\":" + q(m.getLanguage()) + ",\"duration\":" + m.getDuration()
                    + ",\"poster\":" + q(m.getPoster())
                    + ",\"showTimes\":[" + times + "]}";
        }
        return json + "]";
    }

    // all seats of the hall with price and booked status
    static String seatsJson(HashMap<String, String> params) {
        int movieId = Integer.parseInt(params.get("movieId"));
        String show = params.get("show");
        Movie movie = theatre.findMovie(movieId);
        if (movie == null) {
            return error("Movie not found");
        }

        String list = "";
        for (int r = 0; r < Seat.ROWS; r++) {
            for (int n = 1; n <= Seat.COLS; n++) {
                Seat s = new Seat((char) ('A' + r), n, movie);
                boolean taken = theatre.isTaken(movieId, show, s.getId());
                list += (list.isEmpty() ? "" : ",") + "{\"id\":" + q(s.getId()) + ",\"row\":" + q("" + s.getRow())
                        + ",\"number\":" + n + ",\"zone\":" + q(s.getZone()) + ",\"price\":" + s.getPrice()
                        + ",\"corner\":" + s.isCorner() + ",\"taken\":" + taken + "}";
            }
        }
        return "{\"rows\":" + Seat.ROWS + ",\"cols\":" + Seat.COLS + ",\"seats\":[" + list + "]}";
    }

    static String billJson(HashMap<String, String> params) {
        Movie movie = theatre.findMovie(Integer.parseInt(params.get("movieId")));
        if (movie == null) {
            return error("Movie not found");
        }
        int subtotal = 0;
        String seatText = params.getOrDefault("seats", "");
        if (!seatText.isEmpty()) {
            Seat[] seats = theatre.makeSeats(movie, seatText.split(","));
            if (seats == null) {
                return error(theatre.getError());
            }
            for (int i = 0; i < seats.length; i++) {
                subtotal += seats[i].getPrice();
            }
        }
        double gst = Ticket.gstOn(subtotal);
        double total = Math.round((subtotal + gst) * 100) / 100.0;

        return "{\"subtotal\":" + subtotal + ",\"gstPercent\":" + Ticket.getGstPercent() + ",\"gst\":" + gst
                + ",\"total\":" + total + "}";
    }

    static void bookTicket(HttpExchange ex, HashMap<String, String> params) throws IOException {
        int movieId = Integer.parseInt(params.get("movieId"));
        String[] seatIds = params.getOrDefault("seats", "").isEmpty()
                ? new String[0] : params.get("seats").split(",");

        Ticket ticket = theatre.book(movieId, params.get("show"), params.get("name"),
                params.get("phone"), seatIds);
        if (ticket == null) {
            send(ex, 400, error(theatre.getError()));
        } else {
            send(ex, 200, ticketJson(ticket));
        }
    }

    static String findTicketsJson(String text) {
        return ticketsJson(text.trim().isEmpty() ? new Ticket[0] : theatre.search(text, false));
    }

    static String ticketsJson(Ticket[] list) {
        String json = "[";
        for (int i = 0; i < list.length; i++) {
            json += (i > 0 ? "," : "") + ticketJson(list[i]);
        }
        return json + "]";
    }

    static String summaryJson() {
        return "{\"theatre\":" + q(Ticket.getTheatreName()) + ",\"totalTickets\":" + Ticket.getTotalTickets()
                + ",\"gstPercent\":" + Ticket.getGstPercent() + ",\"revenue\":" + theatre.getTotalRevenue() + "}";
    }

    static String ticketJson(Ticket t) {
        String seats = "";
        for (int i = 0; i < t.getSeatCount(); i++) {
            Seat s = t.getSeat(i);
            seats += (i > 0 ? "," : "") + "{\"id\":" + q(s.getId()) + ",\"zone\":" + q(s.getZone())
                    + ",\"price\":" + s.getPrice() + "}";
        }
        return "{\"code\":" + q(t.getTicketCode()) + ",\"type\":" + q(t.getType())
                + ",\"movie\":" + q(t.getMovie().getTitle()) + ",\"show\":" + q(t.getShowTime())
                + ",\"name\":" + q(t.getCustomer().getName()) + ",\"phone\":" + q(t.getCustomer().getPhone())
                + ",\"seats\":[" + seats + "],\"subtotal\":" + t.getSubtotal()
                + ",\"gst\":" + Ticket.gstOn(t.getSubtotal())
                + ",\"total\":" + t.calculateBill() + "}";
    }

    static String q(String text) {
        return "\"" + text.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }

    static String error(String message) {
        return "{\"error\":" + q(message) + "}";
    }

    static HashMap<String, String> readParams(HttpExchange ex) throws IOException {
        String text = ex.getRequestURI().getRawQuery();
        if (ex.getRequestMethod().equals("POST")) {
            text = new String(ex.getRequestBody().readAllBytes(), "UTF-8");
        }
        HashMap<String, String> params = new HashMap<>();
        if (text == null || text.isEmpty()) {
            return params;
        }
        for (String pair : text.split("&")) {
            String[] parts = pair.split("=", 2);
            String value = parts.length > 1 ? URLDecoder.decode(parts[1], "UTF-8") : "";
            params.put(URLDecoder.decode(parts[0], "UTF-8"), value);
        }
        return params;
    }

    static void send(HttpExchange ex, int status, String json) throws IOException {
        byte[] data = json.getBytes("UTF-8");
        ex.getResponseHeaders().add("Content-Type", "application/json; charset=UTF-8");
        ex.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        ex.sendResponseHeaders(status, data.length);
        OutputStream out = ex.getResponseBody();
        out.write(data);
        out.close();
    }
}
