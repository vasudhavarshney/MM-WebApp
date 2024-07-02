import mongoose, { Document, Schema, Model, model } from 'mongoose';
import { SchoolRiceAllotmentHistory } from '../services/Interfaces'

// Create the Mongoose schema
const SchoolRiceAllotmentHistorySchema: Schema = new Schema({
    schoolId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'School'
    },
    classType:{ type: String, emum:["PrimaryClass","MiddleClass"],required: true },
    Month: {
        type: String,
        required: true
    },
    Year: {
        type: String,
        required: true
    },
    "available_rice(kg)": {
        type: Number,
        required: true
    },
    "Alloted_rice(kg)": {
        type: Number,
        required: true
    }
},{timestamps:true});

// Create and export the Mongoose model
export const Rice_Allotment_History = mongoose.model<SchoolRiceAllotmentHistory>('Rice_Allotment_History', SchoolRiceAllotmentHistorySchema);


