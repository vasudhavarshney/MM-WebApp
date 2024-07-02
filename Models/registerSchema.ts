import mongoose from "mongoose";
import { RegisterEntry,ItemDetail } from '../services/Interfaces'
import { ObjectId } from "bson";


const ItemDetail: mongoose.Schema = new mongoose.Schema({
    quantity: { type: Number, required: true },
    amount: { type: Number, required: true },
},{_id:false});
// classType, schoolId, Month, Available_amount, Available_rice, No_of_students
const RegisterEntry: mongoose.Schema = new mongoose.Schema({
    classType:{ type: String, emum:["PrimaryClass","MiddleClass"],required: true },
    schoolId:{type:ObjectId, ref:'School' ,required: true},
    Month: { type: String, required: true },
    Year:{ type: String, required: true },
    Available_amount: { type: Number, required: false ,default:0 },//
    Available_rice: { type: Number, required: false },
    Allotted_Rice: { type: Number, required: false },
    District: { type: String, required: false },
    Block: { type: String, required: false },
    entry_date: { type: Date, required: true },
    No_of_students: { type: Number, required: false },
    Rice_per_student: { type: Number, required: false }, //auto calculate on the basis of classType
    Used_Rice: { type: Number, required: false },//auto calculate from No_of_student * rice_per_student 
    Remaining_Rice: { type: Number, required: false },// Auto calculate from Available_rice - Used_rice
    dal: { type: ItemDetail, required: false },//auto calculate default value on the basis of classType from weeklySchedule data 
    Masala_Namak :{ type: ItemDetail, required: false },//auto calculate default value on the basis of classType from weeklySchedule data 
    Sabji_Soyabean_salad: { type: ItemDetail, required: false },//auto calculate default value on the basis of classType from weeklySchedule data 
    Tel:{ type: ItemDetail, required: false },//auto calculate default value on the basis of classType from weeklySchedule data 
    Jalawan:{ type: ItemDetail, required: false },//auto calculate default value on the basis of classType from weeklySchedule data 
    Labor_charge: { type: Number, required: false, default: 0 },
    Total_expenses: { type: Number, required: false },// auto calculate default value 
    Remaining_amount: { type: Number, required: false },//Available_amount - Total_expenses
},{timestamps:true});


RegisterEntry.pre<RegisterEntry>('save', async function (next) {

    const SchoolDetails = await mongoose.model('School').findOne({_id:this.schoolId});
    const totalExpenes_old=await mongoose.model('RegisterEntry').aggregate([{
        $match:{
            schoolId:this.schoolId,
            Month:this.Month,
            classType:this.classType,
            Year:this.Year,
            entry_date: { $lt: this.entry_date }
        }, 
    },
    {
        $group:{
            _id:null,
            "total":{
                $sum:"$Total_expenses"
            },
            "totalRice":{
                $sum:"$Used_Rice"
            }

        }
    }])
    // console.log("totalExpenes_old----------->",totalExpenes_old)
    if (!SchoolDetails) {
        throw new Error('School not found');
    }
    const WeeklySchedule = await mongoose.model('WeeklySchedule').findOne({ classType: this.classType });
    if (!WeeklySchedule) {
        throw new Error('Schedule not found');
    }

    this.District = SchoolDetails.district;
    this.Block = SchoolDetails.block;
    this.Available_rice= ( this.classType === "PrimaryClass") ?SchoolDetails.PrimaryClass_avsheshChawa:SchoolDetails.MiddleClass_avsheshChawa
    // this.Allotted_Rice =SchoolDetails.prapt_chawal
    
    const RicePerStd =( this.classType === "PrimaryClass") ? 0.1 : 0.15;
    const SchoolMedium  = SchoolDetails.medium
    const UsedRice = Number(this.No_of_students) * RicePerStd;
    const previousTotalRice = totalExpenes_old[0]?.totalRice || 0;
    const RemainingRice = (Number(this.Available_rice) + Number(this.Allotted_Rice)) - (previousTotalRice + UsedRice);
    // console.log("RemainingRice--->",RemainingRice,this.Available_rice,this.Allotted_Rice,previousTotalRice,UsedRice)
    const entryDate:string= this.entry_date?.toDateString() || new Date().toDateString();
    const targeted_weekDay = new Date(entryDate).getDay();
    let targeted_Menu_name 
    if(SchoolMedium==="Hindi"){
        targeted_Menu_name = targeted_weekDay === 1 || targeted_weekDay === 4 ? "Mon/Thu"
        : targeted_weekDay === 3 || targeted_weekDay === 6 ? "Wed/Sat"
            : targeted_weekDay === 2 ? "Tue"
                : targeted_weekDay === 5 ? "Fri" : "Sun";
        if(targeted_weekDay===0){
            throw new Error('As per Admin Hindi Medium Schools will be closed on Sunday');
        }
    }else{
        targeted_Menu_name = targeted_weekDay === 1 || targeted_weekDay === 4 ? "Mon/Thu"
        : targeted_weekDay === 3 || targeted_weekDay === 6 ? "Wed/Sat"
            : targeted_weekDay === 2 ? "Tue"
                : targeted_weekDay === 5 ? "Sun" : "Fri";
        if(targeted_weekDay===5){
            throw new Error('As per Admin Urdu Medium Schools will be closed on Fridays');
        }
    }

    const targetd_menu = WeeklySchedule.days.find((e: { "name": string }) => e.name === targeted_Menu_name);
    // console.log("targeted_Menu_name--------->",targeted_weekDay ,targeted_Menu_name)
    const dal_quantity:number = Number(this.No_of_students) * targetd_menu.items.get("Pulses")?.quantity;
    const dal_amount:number = Number(this.No_of_students) * targetd_menu.items.get("Pulses")?.amount;
    const Masala_Namak_quantity = Number(this.No_of_students) * targetd_menu.items.get("Salt_Spices")?.quantity;
    const Masala_Namak_amount = Number(this.No_of_students) * targetd_menu.items.get("Salt_Spices")?.amount;
    const Sabji_Soyabean_salad_quantity = Number(this.No_of_students) * targetd_menu.items.get("vegetables")?.quantity;
    const Sabji_Soyabean_salad_amount = Number(this.No_of_students) * targetd_menu.items.get("vegetables")?.amount;
    const Tel_quantity = Number(this.No_of_students) * targetd_menu.items.get("Oli_Butter")?.quantity;
    const Tel_amount = Number(this.No_of_students) * targetd_menu.items.get("Oli_Butter")?.amount;
    const Jalawan_quantity = Number(this.No_of_students) * targetd_menu.items.get("Fuel")?.quantity;
    const Jalawan_amount = Number(this.No_of_students) * targetd_menu.items.get("Fuel")?.amount;

    this.Rice_per_student = RicePerStd;
    this.Used_Rice = UsedRice;
    this.Remaining_Rice = RemainingRice;
    this.dal=<ItemDetail>({ quantity: dal_quantity, amount: Number(dal_amount.toFixed(2)) });
    this.Masala_Namak=<ItemDetail>({ quantity: Masala_Namak_quantity, amount: Number(Masala_Namak_amount.toFixed(2)) })
    this.Sabji_Soyabean_salad = <ItemDetail>({ quantity: Sabji_Soyabean_salad_quantity, amount: Number(Sabji_Soyabean_salad_amount.toFixed(2)) })
    this.Tel = <ItemDetail>({ quantity: Tel_quantity, amount: Number(Tel_amount.toFixed(2)) });
    this.Jalawan = <ItemDetail>({ quantity: Jalawan_quantity, amount: Number(Jalawan_amount.toFixed(2)) });
    const sumValue =dal_amount + Masala_Namak_amount + Sabji_Soyabean_salad_amount + Tel_amount + Jalawan_amount;
    this.Total_expenses = Number(sumValue.toFixed(2))
    const old_Expenses=totalExpenes_old

    const oldTotal = old_Expenses[0]?.total || 0;
    console.log("oldTotal=========>",oldTotal)
    const adjustedTotal = (oldTotal === 0) ? sumValue : oldTotal + sumValue;

    this.Remaining_amount = Number((Number(this.Available_amount) - adjustedTotal).toFixed(2));
    // this.Remaining_amount = Number((Number(this.Available_amount) - ((old_Expenses[0]?.total===0 || !old_Expenses[0]?.total)?sumValue:old_Expenses[0]?.total || 0)).toFixed(2));
    next();

});


export const RegisterEntryModel = mongoose.model<RegisterEntry>('RegisterEntry', RegisterEntry);
