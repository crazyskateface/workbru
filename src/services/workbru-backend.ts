async function api<T>(): Promise<T> {
    const base_url = "https://bt1x2687pf.execute-api.us-east-1.amazonaws.com/v1/" // get from env? 
    const path = "places"
    const url = new URL(base_url+path)
    url.searchParams.set("lat", "39.088565")
    url.searchParams.set("lng", "-84.5313728")
    url.searchParams.set("radius", "300")

    const response = await fetch(url)// add token stuff later
    if (!response.ok) {
        throw new Error(response.statusText)
      }
    return await response.json() as T
}

export async function getWorkbruData() {
    //             Passed to T ↴
    const res = await api<{ message: "" }>()
    console.log("response: ", res.message)
    return res.message
  }