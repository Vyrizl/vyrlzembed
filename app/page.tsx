"use client"
import { useState } from "react"

export default function Login(){

 const [key,setKey] = useState("")

 async function login(){

   const r = await fetch("/api/login",{
     method:"POST",
     headers:{ "Content-Type":"application/json" },
     body:JSON.stringify({key})
   })

   const data = await r.json()

   if(data.token){
     localStorage.setItem("token",data.token)
     location.href="/dashboard"
   }
 }

 return(
  <div style={{padding:40}}>
    <h1>Embed Generator Login</h1>

    <input
      placeholder="Enter API Key"
      value={key}
      onChange={e=>setKey(e.target.value)}
    />

    <button onClick={login}>Login</button>
  </div>
 )
}
