// school.controller.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import { StatusCodes } from 'http-status-codes';
import {School as SchoolModel,ISchool as School } from '../Models/schoolSchema';
import { RegisterEntryModel } from '../Models/registerSchema';
import { RegisterEntry } from '../services/Interfaces'
import { Rice_Allotment_History } from '../Models/riceAllotmentHistory'
import { sendSMS,generateOTP,generateMonthlybill,getMonthDates,correctRiceCalculation } from '../services/commoSevices'; // Assuming you have defined this function
import { generateToken  } from '../services/TokenServices'
import MonthlyBill from '../Models/billSchema';
import { MonthName } from '../services/CommonTypesAlias'
import mongoose from 'mongoose';

const APP_NAME = 'MDM Portal';



const registerLogin = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile } = req.body;
        const otp = generateOTP();
        const verificationToken = crypto.randomBytes(40).toString('hex');
        const otp_expire = new Date(new Date().getTime() + 5 * 60 * 1000) // 5 minutes from now
        const existingSchool = await SchoolModel.findOne({ mobileNumber:mobile });
        if (existingSchool) {
            existingSchool.otp = otp;
            existingSchool.verificationToken = verificationToken;
            existingSchool.otpExpiryDate = otp_expire;
            await existingSchool.save();
        } else {
            await SchoolModel.create({
                mobileNumber:mobile,
                otp,
                otpExpiryDate:otp_expire,
                verificationToken,
            });
        }

        await sendSMS({ mobile, message: `${APP_NAME}: Your OTP is ${otp}. It is valid for 5 minutes.` });
        res.status(StatusCodes.OK).json({
            message: `Success! Please check your mobile for the OTP.`,
            status: true,
            verificationToken,
        });
    } catch (error) {
        console.error('Error in register Login:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error : '+error });
    }
};

const verifyOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile, otp, verificationToken } = req.body;
        const school = await SchoolModel.findOne({ mobileNumber:mobile });
        if (!school) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'School not found' });
        }else{
            if (school.otp !== otp || school.verificationToken !== verificationToken || school.otpExpiryDate < new Date()) {
                res.status(StatusCodes.BAD_REQUEST).json({ message: 'Invalid OTP or verification token' });
            }else{
                school.otp = '';
                school.verificationToken = '';
                await school.save();
                const userId= mobile || ""
                const token = generateToken(userId);
                const requiredSchoolData = {
                    _id:school._id,
                    name:school.schoolName,
                    mobileNumber:school.mobileNumber,
                    district:school.district,
                    block:school.block,
                    medium:school.medium,
                    schoolType:school.schoolType,
                    Accesstoken:token
                }
                res.cookie('User_access_token', token, { httpOnly: true, secure: true });
                res.status(StatusCodes.OK).json({ message: 'OTP verified successfully', status: true, ...requiredSchoolData });
            }
        }
    } catch (error) {
        console.error('Error in verify OTP:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error : '+error });
    }
};

const resendOTP = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile } = req.body;
        
        // Check if the school exists
        const existingSchool = await SchoolModel.findOne({ mobileNumber:mobile });
        if (!existingSchool) {
            res.status(StatusCodes.NOT_FOUND).json({ message: 'School not found' });
        }else{
            // Generate new OTP and verification token
            const otp = generateOTP();
            const verificationToken = crypto.randomBytes(40).toString('hex');
            const otp_expire = new Date(new Date().getTime() + 5 * 60 * 1000) // 5 minutes from now

            // Update school document with new OTP and verification token
            existingSchool.otp = otp;
            existingSchool.verificationToken = verificationToken;
            existingSchool.otpExpiryDate = otp_expire;
            await existingSchool.save();

            // Send OTP to the mobile number
            await sendSMS({ mobile, message: `${APP_NAME}: Your new OTP is ${otp}. It is valid for 5 minutes.` });

            res.status(StatusCodes.OK).json({
                message: `Success! New OTP has been sent to your mobile.`,
                status: true,
                verificationToken,
            });
        }

        
    } catch (error) {
        console.error('Error in resend OTP:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error' });
    }
};

const logout = async (req: Request, res: Response): Promise<void> => {
    try {
        res.cookie("User_access_token", "logout", {
            httpOnly: true,
            expires: new Date(Date.now()),
        });
        res.status(StatusCodes.OK).json({ status: true ,message: 'User Logout successful' });
    } catch (error) {
        console.error('Error in logout:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error : '+error });
    }
};

const profile= async (req: Request, res: Response): Promise<void> => {
    try {
        const School_mobile = req.body.userId;
        const targeted_Information  = await SchoolModel.findOne({mobileNumber:School_mobile}).select('-otp -otpExpiryDate -verificationToken -createdAt');
        res.status(StatusCodes.OK).json({
            message: `Fetched Profile Successfully`,
            status: true,
            data:targeted_Information,
        });
    } catch (error) {
        console.error('Error in profile:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error : '+error });
    }
};

const UpdateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const School_mobile = req.body.userId;
        const updatedData = req.body.data;
        if(updatedData.schoolType==='Primary'){
            updatedData.MiddleClass_avsheshChawa = 0
        }
        updatedData.isCompleted=true;
        await SchoolModel.updateOne(
            {mobileNumber:School_mobile},
            {$set:updatedData}
        );
        res.status(StatusCodes.OK).json({
            message: `Profile Updated Successfully`,
            status: true
        });

    } catch (error) {
        console.error('Error in Update Profile:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error : '+error });
    }
};

const getRegistersBySchool = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.body
        const Month = <MonthName>req.query.month || new Date().toLocaleString('default', { month: 'long' }) ;
        const Year =<number> Number(req.query.year)|| new Date().getFullYear() ;
        const  { endDate, startDate } = getMonthDates(Month,Year)
        
        const start = startDate.toISOString().split('T')[0]
        const end = endDate.toISOString().split('T')[0]
        console.log("endDate, startDate1-------->",end,start)
        const SchooleDetails= <School>await SchoolModel.findOne({mobileNumber:userId})
        const BillExist = await MonthlyBill.countDocuments({SchoolId:SchooleDetails._id,Month:Month,Year:Year})
        const isBillGenerated:boolean = (BillExist>0)?true:false///need to modify later on 
        if(!SchooleDetails.isCompleted){
            res.status(StatusCodes.OK).json({
                message: `Profile incomplete! Please update your profile to access Registrs`,
                status: false
            });
        }else{
            // ['Primary', 'Middle school'] ["PrimaryClass","MiddleClass"]
            let PrimaryClassRegister
            let MiddelClassRegister
            let resData
            if(SchooleDetails.schoolType ==='Primary'){
                PrimaryClassRegister = await RegisterEntryModel.find({schoolId:SchooleDetails._id,classType:"PrimaryClass", entry_date: {$gte: start,$lte: end}}).sort({entry_date:1})
                resData ={isBillGenerated, PrimaryClassRegister}
            }else{
                PrimaryClassRegister = await RegisterEntryModel.find({schoolId:SchooleDetails._id,classType:"PrimaryClass",entry_date: {$gte: start,$lte: end}}).sort({entry_date:1})
                MiddelClassRegister = await RegisterEntryModel.find({schoolId:SchooleDetails._id,classType:"MiddleClass",entry_date: {$gte: start,$lte: end}}).sort({entry_date:1})
                resData ={isBillGenerated, PrimaryClassRegister,MiddelClassRegister}
            }   
            res.status(StatusCodes.OK).json({
                message: `Fetched Register Entry Successfully`,
                status: true,
                data:resData
            });
        }
    } catch (error) {
        console.error('Error in registerLogin:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false, message: 'Internal Server Error : '+error });
    }
};
///Continue 
const makeRegisterEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const {classType, entry_date,userId, Allotted_Rice,Available_amount, No_of_students}= req.body
        const Month = new Date(entry_date).toLocaleString('default', { month: 'long' });
        const Year= new Date(entry_date).getFullYear();
        const schooleDetails=<School>await SchoolModel.findOne({mobileNumber:userId})
        
        const schoolId = schooleDetails._id
        const allotedRice =(classType==='PrimaryClass')?schooleDetails.PrimaryClass_prapt_chawal:schooleDetails.MiddleClass_prapt_chawal
        const available_rice = (classType==='PrimaryClass')?schooleDetails.PrimaryClass_avsheshChawa:schooleDetails.MiddleClass_avsheshChawa
        const existingEntry = await RegisterEntryModel.findOne({ entry_date:entry_date,classType,schoolId:schooleDetails._id,Month });
        if (existingEntry) {
            res.status(StatusCodes.OK).json({status: true, message: classType+' Register Entry for '+entry_date+ ' already exists'});
        }else{
            const tem= new RegisterEntryModel({
                classType, schoolId:schooleDetails._id, Month,Year,entry_date, Allotted_Rice:allotedRice+Allotted_Rice, Available_amount,  No_of_students
            })
           
            await tem.save().then(async(r)=>{
                console.log("r --------------->",r._id);
                const entry_id= <mongoose.Types.ObjectId>r._id;
                correctRiceCalculation(entry_id);
                (classType==='PrimaryClass')?schooleDetails.PrimaryClass_prapt_chawal+=Allotted_Rice:schooleDetails.MiddleClass_prapt_chawal+=Allotted_Rice
                // schooleDetails.prapt_chawal+=Allotted_Rice
                await schooleDetails.save().then(async(success)=>{
                    // if(success?._id && Allotted_Rice>0){
                    //     await Rice_Allotment_History.create({
                    //         schoolId:schoolId,
                    //         classType,
                    //         Month:Month,
                    //         Year:new Date(entry_date).getFullYear(),
                    //         "available_rice(kg)":available_rice+allotedRice,
                    //         "Alloted_rice(kg)":Allotted_Rice
                    //     })
                    //     // res.json({ success: true, message: 'Rice Alloted Successfully'});
                    // }
                });
                res.status(StatusCodes.OK).json({
                    message: `Register Entry Successfully Added`,
                    status: true
                });
            }).catch(error=> {
                return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: 'Internal Server Error : '+error });
            })
        }
    } catch (error) {
        console.error('Error in making Register Entry:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false,  message: 'Internal Server Error : '+error });
    }
};

const UpdateRegisterEntry = async (req: Request, res: Response): Promise<void> => {
    try {
        const {entryId, Available_amount,Allotted_Rice, No_of_students}= req.body//,{$set:{No_of_students,Available_amount}}
        const targetData = <RegisterEntry>await RegisterEntryModel.findOne({ _id:entryId })
        targetData.Allotted_Rice=Allotted_Rice;
        targetData.Remaining_Rice=(targetData.Available_rice + Allotted_Rice);
        targetData.Available_amount=Available_amount;
        targetData.No_of_students =No_of_students
        await targetData.save().then(r=>{
            correctRiceCalculation(entryId)
            res.status(StatusCodes.OK).json({
                message: `Register Entry Successfully Updated `,
                status: true
            });
        }).catch(error=> {
            return res.status(StatusCodes.BAD_REQUEST).json({ status: false, message: 'Internal Server Error1 : '+error });
        });

    } catch (error) {
        console.error('Error in registerLogin:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false,  message: 'Internal Server Error : '+error });
    }
};

const generateBill = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = req.body.userId;
        const month:MonthName= req.body.month;
        const year:number= req.body.year;
        const SchoolDetails =<School> await SchoolModel.findOne({mobileNumber:userId}) 
        const data = await generateMonthlybill(SchoolDetails._id,SchoolDetails.medium,month,year)
        res.status(StatusCodes.OK).json({
            message: `Profile Register Entry Successfully`,
            status: true,
            
            data
        });

    } catch (error) {
        console.error('Error in generate Bill:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: 'Internal Server Error : '+error });
    }
};

export { 
    registerLogin, 
    verifyOTP, 
    resendOTP, 
    logout,
    profile,
    UpdateProfile,
    getRegistersBySchool,
    makeRegisterEntry,
    UpdateRegisterEntry,
    generateBill
};

// classType, schoolId, Month, Available_amount, Available_rice, No_of_students
// const <ControllerName> = async (req: Request, res: Response): Promise<void> => {
//     try {

//     } catch (error) {
//         console.error('Error in registerLogin:', error);
//         res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({status: false,  message: 'Internal Server Error : '+error });
//     }
// };