// routes.ts
import express from 'express';

import { 
    riceAllotmentHistory,
    getRegistersBySchool,
    getBillsBySchool
} from '../controllers/CommonControllers';

const CommonRouter = express.Router();
CommonRouter.get('/riceAllotmentHistory', riceAllotmentHistory);
CommonRouter.get('/getRegistersBySchool',  getRegistersBySchool); 
CommonRouter.get('/getBillsBySchool',  getBillsBySchool); 


export default CommonRouter;
