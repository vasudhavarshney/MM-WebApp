import mongoose, { Schema, Document } from 'mongoose';
import mongoosePaginate from 'mongoose-paginate-v2';
import { ISchool } from '../services/Interfaces'

const schoolSchema: Schema = new Schema({
//   date: { type: Date, required: true },
  numberOfStudents: { type: Number, required: false,default:null },
  schoolName: { type: String, required: false,default:null },
  district: { type: String, required: false,default:null },
  block: { type: String, required: false,default:null },
  schoolType: { type: String, enum: ['Primary', 'Middle school'], required: false,default:null },
  medium: { type: String, enum: ['Hindi', 'Urdu'], required: false ,default:null},
  avsheshRashi: { type: Number, required: false,default:0 },
  avsheshChawa: { type: Number, required: false,default:0 },
  PrimaryClass_avsheshChawa: { type: Number, required: false,default:0 },
  MiddleClass_avsheshChawa: { type: Number, required: false,default:0 },
  prapt_chawal:{ type: Number, required: false,default:0 },
  PrimaryClass_prapt_chawal:{ type: Number, required: false,default:0 },
  MiddleClass_prapt_chawal:{ type: Number, required: false,default:0 },
  mobileNumber: { 
    type: String, 
    required: true, 
    validate: {
      validator: function(v: string) {
        return /^\d{10}$/.test(v); // Validate for 10-digit mobile numbers
      },
      message: (props: any) => `${props.value} is not a valid mobile number!`
    }
  },
  otp: { 
    type: String, 
    required: false 
  },
  otpExpiryDate: { 
    type: Date, 
    required: false,
  },
  verificationToken: { 
    type: String, 
    required: false 
  },
  isCompleted:{ 
    type: Boolean,  
    default: false 
  },
  PAN:{ type: String, required: false,default:null },
  AdharNo:{ type: Number, required: false,default:null },
  U_Dise_Code:{ type: Number, required: false,default:null }

},{timestamps: true});



schoolSchema.plugin(mongoosePaginate);
const School = mongoose.model<ISchool>('School', schoolSchema);

export{School ,ISchool};
