import { Types } from "mongoose";
import mongoose from 'mongoose';

export interface SMSParams {
    mobile: string;
    message: string;
}

export interface Admin extends mongoose.Document {
    userName: string;
    password: string;
}

export interface ISchool extends mongoose.Document {
    //   date: Date;
    _id:mongoose.Types.ObjectId;
      numberOfStudents: number;
      schoolName: string;
      district: string;
      block: string;
      schoolType: 'Primary' | 'Middle school';
      medium: 'Hindi' | 'Urdu';
      avsheshRashi:number;
      avsheshChawa: number;
      PrimaryClass_avsheshChawa: number;
      MiddleClass_avsheshChawa: number;
      PrimaryClass_prapt_chawal: number;
      MiddleClass_prapt_chawal: number;
      prapt_chawal:number;
      mobileNumber: string;
      otp: string;
      otpExpiryDate: Date;
      verificationToken: string;
      isCompleted: boolean;
      PAN:string;
      AdharNo:number;
      U_Dise_Code:number;

}

export interface SchoolRiceAllotmentHistory extends mongoose.Document {
    schoolId:mongoose.Types.ObjectId;
    classType:string;
    Month:String;
    Year:String;
    "available_rice(kg)":number;
    "Alloted_rice(kg)":number;
}

export interface ItemDetail extends mongoose.Document {
    quantity: number;
    amount: number;
}

export interface DayDetail extends mongoose.Document {
    name: string; // e.g., 'Tue', 'Fri', etc.
    items: {
        [key: string]: ItemDetail; // e.g., 'मसूर', 'चना', 'मक्का', etc.
    };
    totalAmount: number;
}

export interface WeeklySchedule extends mongoose.Document {
    classType: string; // e.g., 'I-V', 'VI-VIII'
    days: DayDetail[];
    isComplete:Boolean;
}

export interface RegisterEntry extends mongoose.Document {
    classType: string;
    schoolId: mongoose.Types.ObjectId;
    Month: string;
    Year:string;
    Available_amount: number;
    Available_rice: number;
    Allotted_Rice:number;
    District?: string;
    Block?: string;
    entry_date: Date;
    No_of_students?: number;
    Rice_per_student?: number;
    Used_Rice?: number;
    Remaining_Rice?: number;
    dal?: ItemDetail;
    Masala_Namak?: ItemDetail;
    Sabji_Soyabean_salad?: ItemDetail;
    Tel?: ItemDetail;
    Jalawan?: ItemDetail;
    Labor_charge?: number;
    Total_expenses?: number;
    Remaining_amount?: number;
}

export interface BillTitleDetails {
    Total_available_rice: number;
    Available_rice: number;
    Alloted_rice: number;
    district: string;
    block: string;
    medium: string;
}
  
export interface ClassBillData {
    _id: string;
    schoolId: mongoose.Types.ObjectId;
    Month: string;
    Year: number;
    fridayCount: number;
    fridayStudentCount: number;
    sundayCount: number;
    sundayStudentCount: number;
    Dal_total_amount: number;
    Masala_Namak_total_amount: number;
    SabjiSoyabeanSaladTotalAmount: number;
    Tel_total_amount: number;
    Jalawan_total_amount: number;
    Total_expenses_amount: number;
    Used_Rice_total_Quantity_kg: number;
}
  
export interface MonthlyBillDocument extends Document {
    SchoolId: mongoose.Types.ObjectId;
    Month: string;
    Year: number;
    BillTitleDetails: BillTitleDetails;
    PrimaryClassBillData: ClassBillData;
    MiddleClassBillData: ClassBillData;
}

export interface PlanDocument extends Document {
    planName:string;
    PlanPrice: number;
    PlanDuration: string;
    planloginLimit: string;
    isActive: string;
    isdeleted: string;
}