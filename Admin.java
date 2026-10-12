import java.util.UUID;

// Admin login. password is private so other classes cannot read it
public class Admin {

    private String password = "admin123";
    private String token = "";

    public String login(String enteredPassword) {
        if (password.equals(enteredPassword)) {
            token = UUID.randomUUID().toString();
            return token;
        }
        return null;
    }

    public boolean isLoggedIn(String enteredToken) {
        return !token.isEmpty() && token.equals(enteredToken);
    }

    public void logout() {
        token = "";
    }
}
