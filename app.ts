//Import all installed Libraries and packages here 
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';



//Import all  files 
import connectDB from './config/database';


//Import Routes here 
import UserRouter from './routers/userRoutes';
import AdminRouter from './routers/adminRoutes';
import CommonRouter from './routers/commonRoutes';

// Initialize Express
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet()); 
const allowedOrigins = [
    'http://localhost:3000',
    'https://quickmdmreporting.com',
    'https://admin.quickmdmreporting.com'
  ];
  
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(bodyParser.json()); 
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true })); 

// Routes
app.use('/api/v1/user', UserRouter);
app.use('/api/v1/admin', AdminRouter);
app.use('/api/v1/common', CommonRouter);
export default app;
