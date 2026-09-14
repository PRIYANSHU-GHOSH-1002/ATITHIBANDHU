const API_URL = "http://127.0.0.1:8000";


export async function getNearbySafetyAreas(
    latitude,
    longitude
) {
    const response = await fetch(
        `${API_URL}/nearby-areas`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                latitude,
                longitude
            })
        }
    );


    if (!response.ok) {
        throw new Error(
            "Failed to fetch safety data"
        );
    }


    return await response.json();
}