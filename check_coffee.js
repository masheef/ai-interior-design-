
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/CoffeeCart/glTF-Binary/CoffeeCart.glb";
  const res = await fetch(url, { method: 'HEAD' });
  console.log(`CoffeeCart on main: ${res.status}`);
}
check();
