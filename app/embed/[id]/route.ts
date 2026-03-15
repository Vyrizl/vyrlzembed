import { pool } from "@/lib/db"

export async function GET(req,{params}){

 const { id } = params

 const result = await pool.query(
   "SELECT * FROM embeds WHERE id=$1",
   [id]
 )

 const embed = result.rows[0]

 const html = `
 <!DOCTYPE html>
 <html>
 <head>

 <meta property="og:title" content="${embed.title || ""}">
 <meta property="og:description" content="${embed.description || ""}">
 <meta property="og:type" content="${embed.type}">

 ${embed.type === "video.other"
 ? `<meta property="og:video" content="${embed.url}">
    <meta property="og:video:type" content="video/mp4">`
 : `<meta property="og:image" content="${embed.url}">`
 }

 </head>
 <body></body>
 </html>
 `

 return new Response(html,{
  headers:{ "content-type":"text/html" }
 })
}
