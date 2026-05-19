
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`DamagedHelmet on main: ${res.status}`);
}
check();
