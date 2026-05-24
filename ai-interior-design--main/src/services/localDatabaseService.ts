const API_URL = ""; // Relative URL since we are proxying in dev and served from same domain in prod

export async function saveDesignLocally(userId: string, designData: any) {
  try {
    const response = await fetch(`${API_URL}/api/designs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: crypto.randomUUID(),
        userId,
        ...designData,
      }),
    });
    
    if (!response.ok) {
      throw new Error("Failed to save to local database server");
    }
    
    return await response.json();
  } catch (error) {
    console.error("Local Save Error:", error);
    throw error;
  }
}

export async function getUserDesignsLocally(userId: string) {
  try {
    const response = await fetch(`${API_URL}/api/designs/${userId}`);
    if (!response.ok) {
      throw new Error("Failed to fetch from local database server");
    }
    return await response.json();
  } catch (error) {
    console.error("Local Fetch Error:", error);
    throw error;
  }
}

export async function checkLocalServerHealth() {
  try {
    const response = await fetch(`${API_URL}/api/health`);
    const data = await response.json();
    return data.status === "ok";
  } catch {
    return false;
  }
}
