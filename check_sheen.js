
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/SheenChair/glTF-Binary/SheenChair.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`SheenChair on main: ${res.status}`);
}
check();
