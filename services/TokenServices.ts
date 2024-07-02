import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';

const secretKey = 'mqqossnrrtaakggciissyzswc' // Replace with your own secret key

// Function to generate JWT token
const generateToken = (userId: string): string => {
    return jwt.sign({ userId }, secretKey, { expiresIn: '24h' }); // Token expires in 24 hours
};

// Middleware to verify JWT token
const verifyToken = (token: string): Promise<string | jwt.JwtPayload> => {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secretKey, (err, decoded) => {
            if (err) {
                reject(err);
            } else {
                resolve(decoded as string | jwt.JwtPayload);
            }
        });
    });
};

export { generateToken, verifyToken };
