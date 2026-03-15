"use client"
import { useState } from "react"

export default function Dashboard(){

 const [type,setType] = useState("image")
 const [url,setUrl] = useState("")
 const [title,setTitle] = useState("")
 const [desc,setDesc] = useState("")
 const [result,setResult] = useState("")

 async function create(){

  const token = localStorage.getItem("token")

  const r = await fetch("/api/createEmbed",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "Authorization":token
    },
    body:JSON.stringify({
      type:type === "video" ? "video.other":"website",
      url,
      title,
      description:desc
    })
  })

  const data = await r.json()
  setResult(data.embed_url)
 }

 return(
 <div style={{padding:40}}>

 <h2>Create Embed</h2>

 <select onChange={e=>setType(e.target.value)}>
   <option value="image">Image</option>
   <option value="video">Video</option>
 </select>

 <input placeholder="Media URL" onChange={e=>setUrl(e.target.value)} />
 <input placeholder="Title" onChange={e=>setTitle(e.target.value)} />
 <input placeholder="Description" onChange={e=>setDesc(e.target.value)} />

 <button onClick={create}>Create Embed</button>

 {result && <p>Embed URL: {result}</p>}

 </div>
 )
}
