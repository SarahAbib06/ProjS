import User from '../models/User.js';
import jwt from 'jsonwebtoken';



export const protact = async (req,res,next) => {
    let token;

    
        if(req.headers.authorization &&  req.headers.authorization.startsWith("Bearer")){

            try{
                
                token = req.headers.authorization.split(" ")[1];

                const decoded = jwt.verify(token, process.env.JWT_SECRET)

                req.user = await User.findById(decoded.id).select("passwordHash");

                return next();
            
            }catch(err){
                console.error("token verification failed : ", err.message);
                return res.status(401).json({message : "not authorized, token failed"})
            }
            

        }
        return res.status(401).json({message : "not authorized, token failed"});
        

};