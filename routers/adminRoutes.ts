// routes.ts
import express from 'express';
import cron from 'node-cron';

import { 
    login,
    logout,
    UpdateSchedule,
    getSchedule,
    getAllSchools,
    SearchSchools,
    riceAllotment,
    billsettlementBatch
} from '../controllers/adminControllers';
import { authenticateAdmin } from '../middlewares/authentication'

const AdminRouter = express.Router();


AdminRouter.post('/login', login);
AdminRouter.post('/logout',authenticateAdmin, logout);
AdminRouter.put('/UpdateSchedule/:scheduleId',authenticateAdmin, UpdateSchedule);
AdminRouter.get('/getAllSchools',authenticateAdmin, getAllSchools);
AdminRouter.get('/SearchSchools',authenticateAdmin, SearchSchools);
AdminRouter.get('/getSchedule',authenticateAdmin, getSchedule);
AdminRouter.post('/riceAllotment',authenticateAdmin, riceAllotment);


//Monthly settlement Batch
cron.schedule('0 0 1 * *', billsettlementBatch);
// cron.schedule('55 * * * *', billsettlementBatch);//testcron
export default AdminRouter;
