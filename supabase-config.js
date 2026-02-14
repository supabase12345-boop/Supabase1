
// ======================================
// Supabase Configuration - Elite Investors
// ======================================

const SUPABASE_URL = "https://tmksysprwgsbdmavlshm.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRta3N5c3Byd2dzYmRtYXZsc2htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwMTI3NjgsImV4cCI6MjA4NjU4ODc2OH0.-qHz5jtEkTK8S1RseWB5cLmLFfv9vPyTcGkc_D6ru80";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.supabaseClient = supabaseClient;

window.supabaseHelpers = {

  async getAllUsers() {
    const { data, error } = await supabaseClient.from("users").select("*");
    return { success: !error, data, error };
  },

  async getUserById(id) {
    const { data, error } = await supabaseClient.from("users").select("*").eq("id", id).single();
    return { success: !error, data, error };
  },

  async updateUser(id, updates) {
    const { data, error } = await supabaseClient.from("users").update(updates).eq("id", id);
    return { success: !error, data, error };
  },

  async insertUser(user) {
    const { data, error } = await supabaseClient.from("users").insert([user]);
    return { success: !error, data, error };
  },

  async getAllPackages() {
    const { data, error } = await supabaseClient.from("packages").select("*");
    return { success: !error, data, error };
  },

  async getAllTasks() {
    const { data, error } = await supabaseClient.from("tasks").select("*");
    return { success: !error, data, error };
  },

  async incrementTaskCompletion(taskId) {
    const { data, error } = await supabaseClient.rpc("increment_task_completion", { task_id: taskId });
    return { success: !error, data, error };
  },

  async getDashboardStats() {
    const { data, error } = await supabaseClient.from("users").select("id", { count: "exact" });
    return { success: !error, data, error };
  }

};
