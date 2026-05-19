
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/Table/glTF-Binary/Table.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`Table on main: ${res.status}`);
}
check();
