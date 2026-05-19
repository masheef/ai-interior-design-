
async function check() {
  const url = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/Models/AntiqueChair/glTF-Binary/AntiqueChair.glb";
  try {
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`URL: ${url}`);
    console.log(`Status: ${res.status}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
  
  const url2 = "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/AntiqueChair/glTF-Binary/AntiqueChair.glb";
  try {
    const res = await fetch(url2, { method: 'HEAD' });
    console.log(`URL: ${url2}`);
    console.log(`Status: ${res.status}`);
  } catch (e) {
    console.log(`Error: ${e.message}`);
  }
}
check();
