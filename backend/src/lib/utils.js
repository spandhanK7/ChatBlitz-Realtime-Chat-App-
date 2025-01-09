import jwt from 'jsonwebtoken';

export const generateToken = (userId, res) => {            //can call this function using userId and res
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    })

    //send token in cookie
    res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,                 //7 days in milliseconds
        httpOnly: true,                                 //cookie cannot be accessed by client side scripts
        sameSite: "strict",
        secure: process.env.NODE_ENV !== "development"  //In development this is gona false , 
    })                                                  // can also be right: //process.env.NODE_ENV === "production" ? true : false

    return token;
}
