import { pool } from "../../lib/db"
import jwt from "jsonwebtoken"
import { v4 as uuid } from "uuid"

export default async function handler(req,res){

 const token = req.headers.authorization

 try{
   jwt.verify(token,process.env.JWT_SECRET)
 }catch{
   return res.status(401).json({error:"unauthorized"})
 }

 const {type,url,title,description} = req.body

 const id = uuid()

 await pool.query(
   "INSERT INTO embeds(id,type,url,title,description) VALUES($1,$2,$3,$4,$5)",
   [id,type,url,title,description]
 )

 res.json({
   embed_url:`https://yourdomain.vercel.app/embed/${id}`
 })
}
