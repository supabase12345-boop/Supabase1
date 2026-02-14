
async function loadPackagesFromDB() {
    const { data } = await window.supabaseHelpers.getAllPackages();
    return data || [];
}

async function loadTasksFromDB() {
    const { data } = await window.supabaseHelpers.getAllTasks();
    return data || [];
}
