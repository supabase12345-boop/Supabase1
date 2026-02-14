
const SUPABASE_URL = "https://tmksysprwgsbdmavlshm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

window.supabaseHelpers = {

  async insertUser(user) {
    return await supabaseClient.from("users").insert([user]);
  },

  async getUserByEmail(email) {
    return await supabaseClient.from("users").select("*").eq("email", email).single();
  },

  async getAllUsers() {
    return await supabaseClient.from("users").select("*");
  },

  async updateUser(id, updates) {
    return await supabaseClient.from("users").update(updates).eq("id", id);
  },

  async getAllPackages() {
    return await supabaseClient.from("packages").select("*").eq("status", "active");
  },

  async getAllTasks() {
    return await supabaseClient.from("tasks").select("*").eq("status", "active");
  },

  async incrementTaskCompletion(taskId) {
    return await supabaseClient.rpc("increment_task_completion", { task_id: taskId });
  }

};
