//import installed librararies and packages here 
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

//Import Models and interfaces here 
import { Rice_Allotment_History } from '../Models/riceAllotmentHistory'
import {School as SchoolModel,ISchool as School } from '../Models/schoolSchema';
import { RegisterEntryModel } from '../Models/registerSchema';
import MonthlyBill from '../Models/billSchema';


//import Other files and services here 
import { MonthName } from '../services/CommonTypesAlias'
import { getPaginationDetails,getMonthDates } from '../services/commoSevices'



const riceAllotmentHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolId = req.query.schoolId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const data = await Rice_Allotment_History.find({schoolId:schoolId}).skip((page-1)*limit).limit(limit)
        const Total_Record_Count = await Rice_Allotment_History.countDocuments({schoolId:schoolId})
        const url = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift();
        const queryParams = Object.keys(req.query)
        .filter(key => key !== 'page' && key !== 'limit')
        .map(key => {  const value = req.query[key];
            if (value !== undefined && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
              return `${key}=${encodeURIComponent(value)}`;
            }
            return '';})
        .join('&');
        const paginations = getPaginationDetails(Total_Record_Count,page,limit,url,queryParams)
        res.json({ success: true, message: 'Rice Alloted Successfully',result:{data,...paginations}});
    } catch (error) {
        console.error('Error in registerLogin:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error : '+error });
    }
};

const getRegistersBySchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.query
        const Month = <MonthName>req.query.month || new Date().toLocaleString('default', { month: 'long' }) ;
        const Year =<number> Number(req.query.year)|| new Date().getFullYear() ;
        const  { endDate, startDate } = getMonthDates(Month,Year)
        const start = startDate.toISOString().split('T')[0]
        const end = endDate.toISOString().split('T')[0]
        console.log("endDate, startDate1-------->",end,start)
        const SchooleDetails= <School>await SchoolModel.findOne({_id:userId})
        const BillExist = await MonthlyBill.countDocuments({SchoolId:SchooleDetails._id,Month:Month,Year:Year})
        const isBillGenerated:boolean = (BillExist>0)?true:false///need to modify later on 
        if(!SchooleDetails.isCompleted){
            res.status(StatusCodes.OK).json({
                message: `Profile incomplete! Please update your profile to access Registrs`,
                status: false
            });
        }else{
            let PrimaryClassRegister
            let MiddelClassRegister
            let resData
            if(SchooleDetails.schoolType ==='Primary'){
                PrimaryClassRegister = await RegisterEntryModel.find({schoolId:SchooleDetails._id,classType:"PrimaryClass", entry_date: {$gte: start,$lte: end}}).sort({entry_date:1})
                resData = { 
                    Year,
                    Month,
                    isBillGenerated,
                    "PrimaryClassRegister":{
                        avsheshRashi: SchooleDetails.avsheshRashi, 
                        avsheshChawa: SchooleDetails.PrimaryClass_avsheshChawa, 
                        prapt_chawal: SchooleDetails.PrimaryClass_prapt_chawal, 
                        Data: PrimaryClassRegister
                    }
                }
            }else{
                PrimaryClassRegister = await RegisterEntryModel.find({schoolId:SchooleDetails._id,classType:"PrimaryClass",entry_date: {$gte: start,$lte: end}}).sort({entry_date:1})
                MiddelClassRegister = await RegisterEntryModel.find({schoolId:SchooleDetails._id,classType:"MiddleClass",entry_date: {$gte: start,$lte: end}}).sort({entry_date:1})
                resData ={
                    Year,
                    Month,
                    isBillGenerated,
                    "PrimaryClassRegister":{
                        avsheshRashi: SchooleDetails.avsheshRashi, 
                        avsheshChawa: SchooleDetails.PrimaryClass_avsheshChawa, 
                        prapt_chawal: SchooleDetails.PrimaryClass_prapt_chawal, 
                        Data: PrimaryClassRegister
                    },
                    "MiddelClassRegister":{
                        avsheshRashi: SchooleDetails.avsheshRashi, 
                        avsheshChawa: SchooleDetails.MiddleClass_avsheshChawa, 
                        prapt_chawal: SchooleDetails.MiddleClass_prapt_chawal, 
                        Data: MiddelClassRegister
                    }
                }
            }   
            res.status(StatusCodes.OK).json({
                message: `Fetched Register Entry Successfully`,
                status: true,
                data:resData
            });
        }
    } catch (error) {
        console.error('Error in registerLogin:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error : '+error });
    }
};


const getBillsBySchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const schoolId = req.query.schoolId;
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 12;
        const SchooleDetails =<School>await SchoolModel.findOne({_id:schoolId})
        const year = req.query.year || new Date().getFullYear();
        const yearfilter = {Year:year}
        console.log("year------------->",year)
        const data = await MonthlyBill.find({SchoolId:schoolId,...yearfilter}).populate({
            path: 'SchoolId',
            select: 'schoolName' ,
            options: { lean: true },
        }).skip((page-1)*limit).limit(limit)
        const Total_Record_Count = await MonthlyBill.countDocuments({SchoolId:schoolId})
        const url = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift();
        const queryParams = Object.keys(req.query)
        .filter(key => key !== 'page' && key !== 'limit')
        .map(key => {  const value = req.query[key];
            if (value !== undefined && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
              return `${key}=${encodeURIComponent(value)}`;
            }
            return '';})
        .join('&');
    
        const paginations = getPaginationDetails(Total_Record_Count,page,limit,url,queryParams)
        
        res.json({ 
            success: true, 
            message: 'All Bills fetch Successfully',
            result:{SchoolName:SchooleDetails.schoolName, data,...paginations}
        });
        
    } catch (error) {
        console.error('Error in registerLogin:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error : '+error });
    }
};


export { 
    riceAllotmentHistory,
    getRegistersBySchool,
    getBillsBySchool
};



// const <ControllerName> = async (req: Request, res: Response): Promise<void> => {
//     try {
//   
        
//             res.status(StatusCodes.OK).json({
//                 message: `Fetched Register Entry Successfully`,
//                 status: true,
//                 // data:resData
//             });
        
//     } catch (error) {
//         console.error('Error in registerLogin:', error);
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false,  message: 'Internal Server Error : '+error });
//     }
// };