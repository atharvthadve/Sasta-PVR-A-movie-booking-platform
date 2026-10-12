import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Arrays;
import java.util.HashMap;

// handles all /api/admin requests, login token is needed except for login
public class AdminHandler implements HttpHandler {

    static Admin admin = new Admin();
    static final String POSTER_FOLDER = "assets/posters";
    static final int MAX_IMAGE_SIZE = 3 * 1024 * 1024;

    public void handle(HttpExchange ex) throws IOException {
        String path = ex.getRequestURI().getPath();
        try {
            if (path.equals("/api/admin/login")) {
                login(ex, ApiServer.readParams(ex));
                return;
            }

            String token = ex.getRequestHeaders().getFirst("X-Admin-Token");
            if (!admin.isLoggedIn(token)) {
                ApiServer.send(ex, 401, ApiServer.error("Admin login required"));
                return;
            }

            if (path.equals("/api/admin/upload")) {
                uploadPoster(ex);
                return;
            }

            HashMap<String, String> params = ApiServer.readParams(ex);
            if (path.equals("/api/admin/logout")) {
                admin.logout();
                ApiServer.send(ex, 200, "{\"ok\":true}");
            } else if (path.equals("/api/admin/prices")) {
                prices(ex, params);
            } else if (path.equals("/api/admin/movie/add")) {
                addMovie(ex, params);
            } else if (path.equals("/api/admin/movie/update")) {
                updateMovie(ex, params);
            } else if (path.equals("/api/admin/movie/delete")) {
                deleteMovie(ex, params);
            } else if (path.equals("/api/admin/tickets")) {
                ApiServer.send(ex, 200, ApiServer.ticketsJson(ApiServer.theatre.getTickets()));
            } else if (path.equals("/api/admin/posters")) {
                ApiServer.send(ex, 200, postersJson());
            } else {
                ApiServer.send(ex, 404, ApiServer.error("Not found"));
            }
        } catch (NumberFormatException e) {
            ApiServer.send(ex, 400, ApiServer.error("Please enter valid numbers"));
        } catch (Exception e) {
            ApiServer.send(ex, 400, ApiServer.error("Bad request"));
        }
    }

    void login(HttpExchange ex, HashMap<String, String> params) throws IOException {
        String token = admin.login(params.get("password"));
        if (token == null) {
            ApiServer.send(ex, 401, ApiServer.error("Wrong password"));
        } else {
            ApiServer.send(ex, 200, "{\"token\":" + ApiServer.q(token) + "}");
        }
    }

    String pricesJson(Movie movie) {
        return "{\"front\":" + movie.getFrontPrice() + ",\"middle\":" + movie.getMiddlePrice()
                + ",\"balcony\":" + movie.getBalconyPrice() + ",\"corner\":" + movie.getCornerExtra()
                + ",\"gst\":" + Ticket.getGstPercent() + "}";
    }

    // each movie has its own seat prices, GST is same for all
    void prices(HttpExchange ex, HashMap<String, String> params) throws IOException {
        Movie movie = ApiServer.theatre.findMovie(Integer.parseInt(params.get("movieId")));
        if (movie == null) {
            ApiServer.send(ex, 400, ApiServer.error("Movie not found"));
            return;
        }
        if (ex.getRequestMethod().equals("POST")) {
            double gst = Double.parseDouble(params.get("gst"));
            if (gst < 0 || gst > 100) {
                ApiServer.send(ex, 400, ApiServer.error("GST must be between 0 and 100"));
                return;
            }
            boolean done = ApiServer.theatre.setMoviePrices(movie.getId(),
                    Integer.parseInt(params.get("front")), Integer.parseInt(params.get("middle")),
                    Integer.parseInt(params.get("balcony")), Integer.parseInt(params.get("corner")));
            if (!done) {
                ApiServer.send(ex, 400, ApiServer.error(ApiServer.theatre.getError()));
                return;
            }
            Ticket.setGstPercent(gst);
        }
        ApiServer.send(ex, 200, pricesJson(movie));
    }

    void addMovie(HttpExchange ex, HashMap<String, String> params) throws IOException {
        String poster = params.getOrDefault("poster", "");
        if (!posterExists(poster)) {
            ApiServer.send(ex, 400, ApiServer.error("Poster file not found in assets/posters"));
            return;
        }
        Movie movie = ApiServer.theatre.addMovie(params.get("title"), params.get("language"),
                Integer.parseInt(params.get("duration")),
                Theatre.parseShowTimes(params.get("shows")), poster);
        sendResult(ex, movie != null);
    }

    void updateMovie(HttpExchange ex, HashMap<String, String> params) throws IOException {
        String poster = params.getOrDefault("poster", "");
        if (!posterExists(poster)) {
            ApiServer.send(ex, 400, ApiServer.error("Poster file not found in assets/posters"));
            return;
        }
        boolean done = ApiServer.theatre.updateMovie(Integer.parseInt(params.get("id")),
                params.get("title"), params.get("language"),
                Integer.parseInt(params.get("duration")),
                Theatre.parseShowTimes(params.get("shows")), poster);
        sendResult(ex, done);
    }

    void deleteMovie(HttpExchange ex, HashMap<String, String> params) throws IOException {
        boolean done = ApiServer.theatre.deleteMovie(Integer.parseInt(params.get("id")));
        sendResult(ex, done);
    }

    void sendResult(HttpExchange ex, boolean success) throws IOException {
        if (success) {
            ApiServer.send(ex, 200, "{\"ok\":true}");
        } else {
            ApiServer.send(ex, 400, ApiServer.error(ApiServer.theatre.getError()));
        }
    }

    boolean posterExists(String name) {
        if (name.isEmpty()) {
            return true;
        }
        return isGoodFileName(name) && new File(POSTER_FOLDER, name).isFile();
    }

    boolean isGoodFileName(String name) {
        return name.toLowerCase().matches("[a-z0-9_.-]+\\.(png|jpg|jpeg|webp|gif)") && !name.contains("..");
    }

    String postersJson() {
        String[] files = new File(POSTER_FOLDER).list();
        if (files == null) {
            files = new String[0];
        }
        Arrays.sort(files);
        String json = "[";
        boolean first = true;
        for (int i = 0; i < files.length; i++) {
            if (isGoodFileName(files[i])) {
                json += (first ? "" : ",") + ApiServer.q(files[i]);
                first = false;
            }
        }
        return json + "]";
    }

    void uploadPoster(HttpExchange ex) throws IOException {
        String query = ex.getRequestURI().getQuery();
        String name = query.substring(query.indexOf("name=") + 5);
        if (!isGoodFileName(name)) {
            ApiServer.send(ex, 400, ApiServer.error("Use a png, jpg, webp or gif file (letters, numbers, - and _ in the name)"));
            return;
        }
        byte[] data = ex.getRequestBody().readNBytes(MAX_IMAGE_SIZE + 1);
        if (data.length > MAX_IMAGE_SIZE) {
            ApiServer.send(ex, 400, ApiServer.error("Image must be smaller than 3 MB"));
            return;
        }
        new File(POSTER_FOLDER).mkdirs();
        Files.write(Paths.get(POSTER_FOLDER, name), data);
        ApiServer.send(ex, 200, "{\"name\":" + ApiServer.q(name) + "}");
    }
}
