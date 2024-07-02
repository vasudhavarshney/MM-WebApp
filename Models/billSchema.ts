import mongoose, { Schema, Document } from 'mongoose';
import { MonthlyBillDocument } from '../services/Interfaces'


const BillTitleDetailsSchema: Schema = new Schema({
  Total_available_rice: { type: Number, required: true },
  Available_rice: { type: Number, required: true },
  Alloted_rice: { type: Number, required: true },
  district: { type: String, required: true },
  block: { type: String, required: true },
  medium: { type: String, required: true },
});

const ClassBillDataSchema: Schema = new Schema({
  _id: { type: String, required: true },
  schoolId: { type: mongoose.Types.ObjectId, required: false },
  Month: { type: String, required: false },
  Year: { type: Number, required: false },
  fridayCount: { type: Number, required: true },
  fridayStudentCount: { type: Number, required: true },
  sundayCount: { type: Number, required: true },
  sundayStudentCount: { type: Number, required: true },
  Dal_total_amount: { type: Number, required: true },
  Masala_Namak_total_amount: { type: Number, required: true },
  SabjiSoyabeanSaladTotalAmount: { type: Number, required: true },
  Tel_total_amount: { type: Number, required: true },
  Jalawan_total_amount: { type: Number, required: true },
  Total_expenses_amount: { type: Number, required: true },
  "Used_Rice_total_Quantity_kg": { type: Number, required: true },
});

const MonthlyBillSchema: Schema = new Schema({
  SchoolId: { type: mongoose.Types.ObjectId, required: true ,ref:'School'},
  Month: { type: String, required: true },
  Year: { type: Number, required: true },
  BillTitleDetails: { type: BillTitleDetailsSchema, required: true },
  PrimaryClassBillData: { type: ClassBillDataSchema, required: false, default:{
    "_id": "PrimaryClass",
    "fridayCount": 0,
    "fridayStudentCount": 0,
    "sundayCount": 0,
    "sundayStudentCount": 0,
    "Dal_total_amount": 0,
    "Masala_Namak_total_amount":0,
    "SabjiSoyabeanSaladTotalAmount": 0,
    "Tel_total_amount": 0,
    "Jalawan_total_amount": 0,
    "Total_expenses_amount": 0,
    "Used_Rice_total_Quantity_kg": 0
  } },
  MiddleClassBillData: { type: ClassBillDataSchema, required: false,default:{
    "_id": "MiddleClass",
    "fridayCount": 0,
    "fridayStudentCount": 0,
    "sundayCount": 0,
    "sundayStudentCount": 0,
    "Dal_total_amount": 0,
    "Masala_Namak_total_amount":0,
    "SabjiSoyabeanSaladTotalAmount": 0,
    "Tel_total_amount": 0,
    "Jalawan_total_amount": 0,
    "Total_expenses_amount": 0,
    "Used_Rice_total_Quantity_kg": 0
  } },
},{timestamps:true});

export default mongoose.model<MonthlyBillDocument>('MonthlyBill', MonthlyBillSchema);
