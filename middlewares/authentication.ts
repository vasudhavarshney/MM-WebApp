// middlewares/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { verifyToken } from '../services/TokenServices'; // Adjust the path as necessary

const authenticateAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies?.Admin_access_token || req.headers.authorization?.split(' ')[1]; // Assuming token is sent in the Authorization header
    if (!token) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication Invalid' });
    } else {
        try {
            const decoded = await verifyToken(token);
            req.body.userId = (decoded as any).userId; // Attach userId to the request object for further use
            console.log("Here in Admin Authentication middleware------------->",decoded,req.body.userId)
            next();
        } catch (err) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication Invalid' });
        }
    }
};

const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.cookies?.User_access_token || req.headers.authorization?.split(' ')[1]; // Assuming token is sent in the Authorization header
    if (!token) {
        res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication Invalid' });
    } else {
        try {
            const decoded = await verifyToken(token);
            req.body.userId = (decoded as any).userId; // Attach userId to the request object for further use
            console.log("Here in User Authentication middleware------------->",decoded,req.body.userId)
            next();
        } catch (err) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Authentication Invalid' });
        }
    }
};

export { authenticateAdmin, authenticateUser};
