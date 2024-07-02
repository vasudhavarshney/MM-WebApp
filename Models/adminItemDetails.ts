// models.ts
import mongoose, { Schema, Document } from 'mongoose';
import { ItemDetail, DayDetail, WeeklySchedule } from '../services/Interfaces';

// interface ItemDetailDocument extends ItemDetail, Document {}
// interface DayDetailDocument extends DayDetail, Document {}
// interface WeeklyScheduleDocument extends WeeklySchedule, Document {}

const ItemDetail: Schema = new Schema({
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
});

const DayDetail: Schema = new Schema({
    name: { type: String, enum: ["Mon/Thu", "Tue", "Wed/Sat", "Fri"],required: true },
    items: { type: Map, of: ItemDetail, required: true ,_id: false },
    totalAmount: { type: Number, required: true },
});

const WeeklySchedule: Schema = new Schema({
    classType: { type: String, emum:["PrimaryClass","MiddleClass"],required: true },//["PrimaryClass"-1-5th class,"MiddleClass"-6th-8th class]
    days: { type: [DayDetail], required: false, default:[], },
    isComplete:{type: Boolean, required: false, default:false}
});

export const WeeklyScheduleModel = mongoose.model<WeeklySchedule>('WeeklySchedule', WeeklySchedule);


