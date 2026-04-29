import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel'


//API to register user
const registerUser= async (req,res) => {
try
 {
  const { name,email,password} =req.body

  if(!name || !password|| !email)
    {
    return res.json({success:false,message:"Missing Details"})
    }
//Validating email Format
if(!validator.isEmail(email))
{
    return res.json({success:false,message:"Enter a Valid Email"})
}
//Validiating a strong Password
if(password.lenght <8)
{
      return res.json({success:false,message:"Enter a Strong Password with 8 Characters"})  
}
//hashing user password
const salt = await bcrypt.genSalt(10)
const hashedPassword = await bcrypt.hash(password,salt)

const userData = {name,email, password:hashedPassword}
const newUser = new userModel(userData)
const user =  await newUser.save()


    } catch (error) {}
} 