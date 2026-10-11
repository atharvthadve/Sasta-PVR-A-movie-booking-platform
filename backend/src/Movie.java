// Movie class, every movie has its own seat prices
public class Movie {

    private int id;
    private String title = "Unknown";
    private String language = "Hindi";
    private int duration = 120;
    private String[] showTimes;
    private String poster = "";

    private int frontPrice = 150;
    private int middlePrice = 220;
    private int balconyPrice = 300;
    private int cornerExtra = 40;

    // default constructor
    public Movie() {
        this(0, "Unknown", "Hindi", 120, new String[] { "07:00 PM" });
    }

    // calls the other constructor using this(...)
    public Movie(int id, String title, String language, int duration, String[] showTimes) {
        this(id, title, language, duration, showTimes, "");
    }

    public Movie(int id, String title, String language, int duration, String[] showTimes, String poster) {
        this.id = id;
        setTitle(title);
        setLanguage(language);
        setDuration(duration);
        this.showTimes = showTimes;
        this.poster = poster;
    }

    // copy constructor
    public Movie(Movie other) {
        this(other.id, other.title, other.language, other.duration, other.showTimes.clone(), other.poster);
        this.frontPrice = other.frontPrice;
        this.middlePrice = other.middlePrice;
        this.balconyPrice = other.balconyPrice;
        this.cornerExtra = other.cornerExtra;
    }

    public boolean hasShow(String time) {
        for (int i = 0; i < showTimes.length; i++) {
            if (showTimes[i].equalsIgnoreCase(time)) {
                return true;
            }
        }
        return false;
    }

    public boolean setPrices(int front, int middle, int balcony, int corner) {
        if (front <= 0 || middle <= 0 || balcony <= 0 || corner < 0
                || front > 5000 || middle > 5000 || balcony > 5000 || corner > 1000) {
            return false;
        }
        this.frontPrice = front;
        this.middlePrice = middle;
        this.balconyPrice = balcony;
        this.cornerExtra = corner;
        return true;
    }

    public int getId() { return id; }
    public String getTitle() { return title; }
    public String getLanguage() { return language; }
    public int getDuration() { return duration; }
    public String[] getShowTimes() { return showTimes; }
    public String getPoster() { return poster; }
    public int getFrontPrice() { return frontPrice; }
    public int getMiddlePrice() { return middlePrice; }
    public int getBalconyPrice() { return balconyPrice; }
    public int getCornerExtra() { return cornerExtra; }

    public void setTitle(String title) {
        if (title == null || title.trim().isEmpty()) {
            System.out.println("Title cannot be empty");
            return;
        }
        this.title = title.trim();
    }

    public void setLanguage(String language) {
        if (language == null || language.trim().isEmpty()) {
            System.out.println("Language cannot be empty");
            return;
        }
        this.language = language.trim();
    }

    public void setDuration(int duration) {
        if (duration <= 0) {
            System.out.println("Duration must be positive");
            return;
        }
        this.duration = duration;
    }

    public void setShowTimes(String[] showTimes) {
        this.showTimes = showTimes;
    }

    public void setPoster(String poster) {
        this.poster = poster;
    }
}
