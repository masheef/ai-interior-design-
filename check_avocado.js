
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Avocado/glTF-Binary/Avocado.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`Avocado on main: ${res.status}`);
}
check();
