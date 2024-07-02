// routes.ts
import express from 'express';
import { 
    registerLogin, 
    verifyOTP, 
    resendOTP ,
    logout,
    profile,
    UpdateProfile,
    getRegistersBySchool,
    makeRegisterEntry,
    UpdateRegisterEntry,
    generateBill
} from '../controllers/userControllers'
import { authenticateUser } from '../middlewares/authentication'

const UserRouter = express.Router();

UserRouter.post('/register-login', registerLogin);
UserRouter.post('/verify-otp', verifyOTP);
UserRouter.post('/resend-otp', resendOTP);
UserRouter.post('/logout', authenticateUser, logout);
UserRouter.get('/profile', authenticateUser, profile);
UserRouter.put('/UpdateProfile', authenticateUser, UpdateProfile);
UserRouter.get('/getRegistersBySchool', authenticateUser, getRegistersBySchool); //will fetch all the registered data for the current month 
UserRouter.post('/makeRegisterEntry', authenticateUser, makeRegisterEntry);
UserRouter.post('/UpdateRegisterEntry', authenticateUser, UpdateRegisterEntry);
UserRouter.post('/generateBill', authenticateUser, generateBill);



///set Schools Monthly Bill Generate Batch here 


export default UserRouter;
