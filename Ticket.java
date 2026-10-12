// Ticket class, main class of the project
public class Ticket {

    private static int totalTickets = 0; // static, shared by all tickets
    private static String theatreName = "Sasta PVR";
    private static double gstPercent = 18;

    protected int ticketId; // protected, subclass can use it

    private Movie movie; // composition (has-a)
    private Customer customer; // composition (has-a)
    private String showTime;
    private Seat[] seats = new Seat[8];
    private int seatCount = 0;

    // default constructor, calls the other one using this(...)
    public Ticket() {
        this(new Movie(), new Customer(), "07:00 PM");
    }

    public Ticket(Movie movie, Customer customer, String showTime) {
        this.movie = movie;
        this.customer = customer;
        this.showTime = showTime;
        totalTickets++;
        this.ticketId = totalTickets;
    }

    // copy constructor
    public Ticket(Ticket other) {
        this(new Movie(other.movie), new Customer(other.customer), other.showTime);
        for (int i = 0; i < other.seatCount; i++) {
            addSeat(new Seat(other.seats[i]));
        }
    }

    public boolean addSeat(Seat seat) {
        if (seatCount == seats.length) {
            return false;
        }
        seats[seatCount] = seat;
        seatCount++;
        return true;
    }

    public int getSubtotal() {
        int sum = 0;
        for (int i = 0; i < seatCount; i++) {
            sum = sum + seats[i].getPrice();
        }
        return sum;
    }

    public static double gstOn(int amount) {
        return Math.round(amount * gstPercent) / 100.0;
    }

    private double baseBill() {
        double bill = getSubtotal() + gstOn(getSubtotal());
        return Math.round(bill * 100) / 100.0;
    }

    // method overloading, same name different parameter
    public double calculateBill() {
        return baseBill();
    }

    public double calculateBill(double discountPercent) {
        if (discountPercent < 0 || discountPercent > 100) {
            return baseBill();
        }
        return Math.round(baseBill() * (100 - discountPercent)) / 100.0;
    }

    public String getType() {
        return "Standard";
    }

    public void display() {
        System.out.println("-------------------------------------");
        System.out.println(theatreName + " | Ticket " + getTicketCode() + " (" + getType() + ")");
        System.out.println("Movie    : " + movie.getTitle() + " (" + movie.getLanguage() + ")");
        System.out.println("Show     : " + showTime);
        System.out.println("Customer : " + customer.getName() + " - " + customer.getPhone());
        System.out.print("Seats    : ");
        for (int i = 0; i < seatCount; i++) {
            System.out.print(seats[i].getId() + "(Rs." + seats[i].getPrice() + ") ");
        }
        System.out.println();
        System.out.println("Subtotal : Rs." + getSubtotal());
        System.out.println("GST " + gstPercent + "% : Rs." + gstOn(getSubtotal()));
    }

    // static method, call it with class name
    public static void displayTotalCount() {
        System.out.println("Total tickets created: " + totalTickets);
    }

    public static int getTotalTickets() { return totalTickets; }
    public static String getTheatreName() { return theatreName; }
    public static double getGstPercent() { return gstPercent; }

    public static void setGstPercent(double percent) {
        if (percent < 0 || percent > 100) {
            System.out.println("GST must be between 0 and 100");
            return;
        }
        gstPercent = percent;
    }

    public String getTicketCode() { return String.format("SP%04d", ticketId); }
    public Movie getMovie() { return movie; }
    public Customer getCustomer() { return customer; }
    public String getShowTime() { return showTime; }
    public int getSeatCount() { return seatCount; }
    public Seat getSeat(int index) { return seats[index]; }
}
