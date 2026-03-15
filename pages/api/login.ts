import { pool } from "../../lib/db"
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

export default async function handler(req,res){

 const { key } = req.body

 const result = await pool.query("SELECT key_hash FROM api_keys")

 for (const row of result.rows){

   const valid = await bcrypt.compare(key,row.key_hash)

   if(valid){
      const token = jwt.sign({auth:true},process.env.JWT_SECRET,{expiresIn:"1h"})
      return res.json({token})
   }

 }

 res.status(401).json({error:"invalid key"})
}
