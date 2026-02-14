
const SUPABASE_URL = "https://tmksysprwgsbdmavlshm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class InvestmentApp {

    constructor() {
        this.user = null;
        this.init();
    }

    async init() {
        await this.loadPackages();
    }

    async register(name, email, password) {

        const { error } = await supabaseClient.from("users").insert([{
            name,
            email,
            password,
            balance: 0,
            status: "active"
        }]);

        if (!error) {
            alert("تم إنشاء الحساب بنجاح");
        } else {
            alert(error.message);
        }
    }

    async loadPackages() {
        const { data, error } = await supabaseClient
            .from("packages")
            .select("*")
            .eq("status", "active");

        if (!error) {
            console.log("Packages from DB:", data);
        } else {
            console.error(error);
        }
    }

}

window.app = new InvestmentApp();
