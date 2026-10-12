import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

// sends poster images from the assets folder
public class AssetHandler implements HttpHandler {

    public void handle(HttpExchange ex) throws IOException {
        Path folder = Paths.get("assets").toAbsolutePath().normalize();
        String name = ex.getRequestURI().getPath().substring("/assets/".length());
        Path file = folder.resolve(name).normalize();

        if (!file.startsWith(folder) || !Files.isRegularFile(file)) {
            ex.sendResponseHeaders(404, -1);
            return;
        }

        byte[] data = Files.readAllBytes(file);
        ex.getResponseHeaders().add("Content-Type", contentType(name.toLowerCase()));
        ex.getResponseHeaders().add("Cache-Control", "no-cache");
        ex.sendResponseHeaders(200, data.length);
        OutputStream out = ex.getResponseBody();
        out.write(data);
        out.close();
    }

    static String contentType(String name) {
        if (name.endsWith(".png")) return "image/png";
        if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
        if (name.endsWith(".webp")) return "image/webp";
        if (name.endsWith(".gif")) return "image/gif";
        return "application/octet-stream";
    }
}
