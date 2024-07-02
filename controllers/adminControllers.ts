import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

//import Schema and Interfaces here 
import { DayDetail, ISchool,MonthlyBillDocument} from '../services/Interfaces';
import{ Rice_Allotment_History } from '../Models/riceAllotmentHistory'
import { AdminModel } from '../Models/adminSchema';
import { WeeklyScheduleModel } from '../Models/adminItemDetails'
import { School } from '../Models/schoolSchema'
import MonthlyBill from '../Models/billSchema';

//import services here 
import { getPaginationDetails,generateMonthlybill,auto_total } from '../services/commoSevices'
import { generateToken  } from '../services/TokenServices'
import { MonthName } from '../services/CommonTypesAlias'



const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userName, password } = req.body;
        const admin = await AdminModel.findOne({ userName:userName });
        if (!admin) {
            res.status(StatusCodes.UNAUTHORIZED).json({ message: 'Invalid username or password' });
        } else {
            const isPasswordCorrect = await bcrypt.compare(password, admin.password);
            if (!isPasswordCorrect) {
                res.status(StatusCodes.BAD_REQUEST).json({
                message: "Username Or Password Is Not Correct",
                status: false,
                });
            }
            const userId= admin.userName || ""
            const token = generateToken(userId); // Assuming admin has _id field
            res.cookie('Admin_access_token', token, { httpOnly: true, secure: true });
            res.status(StatusCodes.OK).json({ message: 'Login successful', status: true, token });
        }
    } catch (error) {
        console.error('Error in login:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.cookie("Admin_access_token", "logout", {
            httpOnly: true,
            expires: new Date(Date.now()),
        });
        res.status(StatusCodes.OK).json({ message: 'Logout successful', status: true });
    } catch (error) {
        console.error('Error in logout:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error' });
    }
};

const getAllSchools=async (req: Request, res: Response ) => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const project = {
            $project:{
                otp:0,
                otpExpiryDate:0,
                verificationToken:0,
                __v:0
            }
        }
        const skip ={$skip:((page-1)*limit)};
        const limitStage={$limit:limit} 
        const all_Schools = await School.aggregate([project,skip,limitStage])
        const Total_Record_Count = await School.countDocuments({})
        const url = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift();
        const queryParams = Object.keys(req.query)
        .filter(key => key !== 'page' && key !== 'limit')
        .map(key => {  const value = req.query[key];
            if (value !== undefined && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
              return `${key}=${encodeURIComponent(value)}`;
            }
            return '';})
        .join('&');
        const pagination = getPaginationDetails(Total_Record_Count,page,limit,url,queryParams)
        res.json({ success: true, message: 'Fetched Data successfully',result:{data:all_Schools,...pagination} });
    } catch (error:any) {
        res.status(500).json({ success: false, message: 'Failed to create weekly schedule', error: error.message });
    }
}

const SearchSchools = async (req: Request, res: Response): Promise<void> => {
    try {
        const page = Number(req.query.page) || 1;
        const limit = Number(req.query.limit) || 10;
        const searchString = req.query.searchString
        const match = {
            $match: {
              $and: [
                {
                  $or: [
                    { mobileNumber: { $regex: searchString, $options: 'i' } },
                    { schoolName: { $regex: searchString, $options: 'i' } }
                  ]
                }
              ]
            }
          }
        const project = {
            $project:{
                otp:0,
                otpExpiryDate:0,
                verificationToken:0,
                __v:0
            }
        }
        const skip ={$skip:((page-1)*limit)};
        const limitStage={$limit:limit} 
        const all_Schools = await School.aggregate([match,project,skip,limitStage])
        console.log("[project,skip,limitStage]---------->",JSON.stringify([match,project,skip,limitStage]))
        const Total_Record_Count = await School.aggregate([match,project])
        .then(result => {
          return result.length
        }) || 0
        const url = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift();
        const queryParams = Object.keys(req.query)
        .filter(key => key !== 'page' && key !== 'limit')
        .map(key => {  const value = req.query[key];
            if (value !== undefined && (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean')) {
              return `${key}=${encodeURIComponent(value)}`;
            }
            return '';})
        .join('&');
        const pagination = getPaginationDetails(Total_Record_Count,page,limit,url,queryParams)
        res.json({ success: true, message: 'Fetched Data successfully',result:{data:all_Schools,...pagination} });
    } catch (error:any) {
        res.status(500).json({ success: false, message: 'Failed to create weekly schedule', error: error.message });
    }
};

const validateAdmin=async (req: Request, res: Response ) => {
    try {
    //  will Admin Added all the necessary Information in here 
    //  check weekschedule Completeion

        res.json({ success: true, message: 'Weekly schedule created successfully'});
    } catch (error:any) {
        res.status(500).json({ success: false, message: 'Failed to create weekly schedule', error: error.message });
    }
}

const getSchedule=async (req: Request, res: Response ) => {
    try {
        const Schedules__data = await WeeklyScheduleModel.find();
        res.json({ success: true, message: 'Fetched Weekly schedules successfully' ,data:Schedules__data});
    } catch (error:any) {
        res.status(500).json({ success: false, message: 'Failed to Fetch Weekly schedules', error: error.message });
    }
}

const UpdateSchedule=async (req: Request, res: Response ) => {
    try {
        const { scheduleId  } = req.params
        const { days } = req.body;
        const AutoCorrected = auto_total(days)
        await WeeklyScheduleModel.updateOne({_id:scheduleId},{$set:{days:AutoCorrected}});
        res.json({ success: true, message: 'Weekly schedule created successfully' });
    } catch (error:any) {
        res.status(500).json({ success: false, message: 'Failed to create weekly schedule', error: error.message });
    }
}

const AddDaybyScheduleId=async (req: Request, res: Response ) => {
    try {
        const {ScheduleId, name, items} = req.body;
        let totalAmount = 0;
        for (const key in items) {
          if (items.hasOwnProperty(key)) {
            totalAmount += items[key].amount;
          }
        }

        const newDay= <DayDetail>{
            name,
            items,
            totalAmount
        }

        const targetSchedule = await WeeklyScheduleModel.findOne({_id:ScheduleId})
        const newWeeklySchedule = await  WeeklyScheduleModel.findOneAndUpdate({
            _id:ScheduleId
        },{
            $push:{days:newDay}
        }
    );
        // await newWeeklySchedule.save();
        res.json({ success: true, message: 'Day added successfully'});
    } catch (error:any) {
        res.status(500).json({ success: false, message: 'Failed to adding day schedule', error: error.message });
    }
}

const riceAllotment = async (req: Request, res: Response): Promise<void> => {
    try {
        const riceQuantity = req.body.quantity;
        const schoolId = req.body.schoolId;
        const Current_Month = new Date().toLocaleString('default', { month: 'long' });
        const Current_Year = new Date().getFullYear();
        const schoolDetails =<ISchool> await School.findOne({_id:schoolId})
        const available_rice = schoolDetails.avsheshChawa + schoolDetails.prapt_chawal
        schoolDetails.prapt_chawal+=Number(riceQuantity)
        await schoolDetails.save().then(async(success)=>{
            if(success?._id){
                await Rice_Allotment_History.create({
                    schoolId:schoolId,
                    Month:Current_Month,
                    Year:Current_Year,
                    "available_rice(kg)":available_rice,
                    "Alloted_rice(kg)":riceQuantity
                })
                res.json({ success: true, message: 'Rice Alloted Successfully'});
            }
        })
    } catch (error) {
        console.error('Error in rice Allotment:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error : '+error });
    }
};

// const settleRice=async (SchoolId:mongoose.Types.ObjectId)=>{
//     const targetedSchool =<ISchool> await School.findOne({_id:SchoolId})
//     const TotalRICE =targetedSchool.avsheshChawa+targetedSchool.prapt_chawal
//     targetedSchool.avsheshChawa=TotalRICE -0

// }
const generateAndSaveMonthlybill=async(SchoolId:mongoose.Types.ObjectId)=>{
    const schoolDetails = <ISchool> await School.findOne({_id:SchoolId})
    const monthIndices = {
         0:"January",
         1:"February",
         2:"March",
         3:"April",
         4:"May",
         5:"June",
         6:"July",
         7:"August",
         8:"September",
         9:"October",
         10:"November",
         11:"December"
    }
    const t:number= new Date().getMonth()
    const year:number =(t===0)?new Date().getFullYear()-1:new Date().getFullYear()
    const getPreviousMonth:MonthName=((t-1)<0)?<MonthName>monthIndices[(11)]:<MonthName>monthIndices[(t-1) as keyof typeof monthIndices]
    // console.log("gerateMonthbill Parameters--->",SchoolId,schoolDetails.medium, getPreviousMonth, year)
    // const getCurrenctmONTH=<MonthName>monthIndices[t as keyof typeof monthIndices];
    const billData=await generateMonthlybill(SchoolId,schoolDetails.medium, getPreviousMonth, year)
    // console.log("billData-------", billData)
    const PrimaryClass_TotalRICE =schoolDetails.PrimaryClass_avsheshChawa + schoolDetails.PrimaryClass_prapt_chawal
    const MiddleClass_TotalRICE =schoolDetails.MiddleClass_avsheshChawa + schoolDetails.MiddleClass_prapt_chawal
    schoolDetails.PrimaryClass_prapt_chawal = 0;
    schoolDetails.MiddleClass_prapt_chawal = 0;
    schoolDetails.PrimaryClass_avsheshChawa=PrimaryClass_TotalRICE - (billData?.PrimaryClassBillData?.Used_Rice_total_Quantity_kg || 0) 
    schoolDetails.MiddleClass_avsheshChawa=MiddleClass_TotalRICE - (billData?.MiddleClassBillData?.Used_Rice_total_Quantity_kg || 0) 
    const newBill = new MonthlyBill({
        SchoolId: schoolDetails._id,
        Month:getPreviousMonth,
        Year:year,
        BillTitleDetails:billData.BillTitleDetails,
        PrimaryClassBillData:billData.PrimaryClassBillData,
        MiddleClassBillData:billData.MiddleClassBillData
    });
    await newBill.save();
    await schoolDetails.save()
}
//Batch Controller
export const billsettlementBatch=async()=>{
    //get the schoolId list 
    console.log("Start billsettlementBatch Execution: ",Date())
    const schoollist:{_id:mongoose.Types.ObjectId}[] =await School.find().select('_id');
    schoollist.forEach(async(SchoolId)=>{
        generateAndSaveMonthlybill(SchoolId._id);
        // settleRice(SchoolId._id)
    })
    console.log("End billsettlementBatch Execution: ",Date())
}

export { 
    login,
    logout,
    getSchedule,
    getAllSchools,
    SearchSchools,
    validateAdmin,
    UpdateSchedule,
    AddDaybyScheduleId,
    riceAllotment,
};


// classType, schoolId, Month, Available_amount, Available_rice, No_of_students
// const <ControllerName> = async (req: Request, res: Response): Promise<void> => {
//     try {
        // res.json({ success: true, message: 'Rice Alloted Successfully'});
//     } catch (error) {
//         console.error('Error in registerLogin:', error);
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false,  message: 'Internal Server Error : '+error });
//     }
// };