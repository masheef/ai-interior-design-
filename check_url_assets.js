
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/AntiqueChair/glTF-Binary/AntiqueChair.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`AntiqueChair on Assets repo: ${res.status}`);
}
check();
