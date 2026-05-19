
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/AntiqueChair/glTF-Binary/AntiqueChair.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`AntiqueChair on main: ${res.status}`);
}
check();
