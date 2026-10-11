// Seat class, price depends on row, corner and the movie
public class Seat {

    public static final int ROWS = 8;
    public static final int COLS = 10;

    private char row;
    private int number;
    private int price; // fixed when seat is created, old tickets keep old price

    public Seat(char row, int number, int price) {
        this.row = row;
        this.number = number;
        this.price = price;
    }

    // gets price from the movie
    public Seat(char row, int number, Movie movie) {
        this(row, number, 0);
        this.price = calculatePrice(movie);
    }

    // copy constructor
    public Seat(Seat other) {
        this(other.row, other.number, other.price);
    }

    public String getZone() {
        int rowIndex = row - 'A';
        if (rowIndex < 3) {
            return "Front";
        } else if (rowIndex < 6) {
            return "Middle";
        }
        return "Balcony";
    }

    public boolean isCorner() {
        return number == 1 || number == 2 || number == COLS || number == COLS - 1 ;
    }

    private int calculatePrice(Movie movie) {
        int basePrice;
        if (getZone().equals("Front")) {
            basePrice = movie.getFrontPrice();
        } else if (getZone().equals("Middle")) {
            basePrice = movie.getMiddlePrice();
        } else {
            basePrice = movie.getBalconyPrice();
        }
        if (isCorner()) {
            basePrice = basePrice + movie.getCornerExtra();
        }
        return basePrice;
    }

    public char getRow() { return row; }
    public int getNumber() { return number; }
    public int getPrice() { return price; }
    public String getId() { return "" + row + number; }
}
