// Customer class, a Ticket has a Customer (composition)
public class Customer {

    private String name = "Guest";
    private String phone = "0000000000";

    public Customer() {
        this("Guest", "0000000000");
    }

    public Customer(String name, String phone) {
        setName(name);
        setPhone(phone);
    }

    // copy constructor
    public Customer(Customer other) {
        this(other.name, other.phone);
    }

    public String getName() { return name; }
    public String getPhone() { return phone; }

    public static boolean isValidName(String name) {
        return name != null && name.trim().length() >= 2;
    }

    public static boolean isValidPhone(String phone) {
        return phone != null && phone.matches("[0-9]{10}");
    }

    public void setName(String name) {
        if (!isValidName(name)) {
            System.out.println("Name must have at least 2 letters");
            return;
        }
        this.name = name.trim();
    }

    public void setPhone(String phone) {
        if (!isValidPhone(phone)) {
            System.out.println("Phone number must be 10 digits");
            return;
        }
        this.phone = phone;
    }
}
