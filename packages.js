
async function loadPackagesFromDB() {
  const { data, error } = await window.supabaseClient
    .from("packages")
    .select("*")
    .eq("status","active")
    .order("price",{ascending:true});
  if(error){console.error(error);return;}
  const c=document.getElementById("packagesContainer");
  if(!c) return;
  c.innerHTML="";
  data.forEach(p=>{
    c.innerHTML+=`
    <div class="package-card">
      <h3>${p.name}</h3>
      <p>السعر: $${p.price}</p>
      <p>الربح اليومي: $${p.daily_profit}</p>
      <p>المدة: ${p.duration} يوم</p>
    </div>`;
  });
}
document.addEventListener("DOMContentLoaded",loadPackagesFromDB);
