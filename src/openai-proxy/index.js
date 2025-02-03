export function OpenaiObject(method = "", model = "", data = {}){
    this.method = method
    this.body = {}
    this.body.model = model
    for(const key of Object.keys(data))
      this.body[key] = data[key]
}

export async function getOpenai(object){
    const url = "https://openai-api-worker.slendyx2002.workers.dev/"

    const response = await fetch(url, {
        method:'POST',
        headers:
        {
        "content-type": "application/javascript"
        },
        body: JSON.stringify(object)
    })

    const data = await response.json()

    return data
}