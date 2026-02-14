
class InvestmentApp {

    constructor() {
        this.user = null;
        console.log("🚀 Elite Investors Production Mode");
    }

    async register(name, email, password) {

        const newUser = {
            name: name,
            email: email,
            password: password,
            balance: 0,
            status: "active"
        };

        const { error } = await window.supabaseHelpers.insertUser(newUser);

        if (!error) {
            alert("✅ تم إنشاء الحساب بنجاح");
        } else {
            alert("❌ خطأ: " + error.message);
        }
    }

}

window.app = new InvestmentApp();
