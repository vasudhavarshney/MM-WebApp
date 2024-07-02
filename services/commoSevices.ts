import axios from 'axios';
import mongoose from 'mongoose';
import { RegisterEntryModel } from '../Models/registerSchema'
import { School } from '../Models/schoolSchema';
import { MonthName } from '../services/CommonTypesAlias'
import { ItemDetail, DayDetail,RegisterEntry, SMSParams, ISchool } from '../services/Interfaces'

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendSMS = async ({ mobile, message }: SMSParams): Promise<any> => {
  const baseUri = process.env.baseUri; // Replace with your base URI
  const instanceId = process.env.instanceId; // Replace with your instance ID
  const accessToken = process.env.accessToken; // Replace with your access token

  const config = {
    method: 'get',
    maxBodyLength: Infinity,
    url: `${baseUri}?instance_id=${instanceId}&access_token=${accessToken}&type=text&number=${mobile}&message=${message}`,
    headers: {}
  };

  try {
    const resp = await axios.request(config);
    //console.log(JSON.stringify(resp.data));
    return resp.data;
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const getPaginationDetails = (totalRecords: number, page: number, limit: number, url: String, queryParams: String) => {
  const totalPages = Math.ceil(totalRecords / limit);
  return {
    totalRecords,
    totalPages,
    currentPage: page,
    nextPage: (page < totalPages) ? `${url}?${queryParams}&page=${page + 1}&limit=${limit}` : null,
    prevPage: (page > 1) ? `${url}?${queryParams}&page=${page - 1}&limit=${limit}` : null
  };
};

export const getMonthDates = (monthName: MonthName, year: number) => {
  const monthIndices = {
    "January": 0,
    "February": 1,
    "March": 2,
    "April": 3,
    "May": 4,
    "June": 5,
    "July": 6,
    "August": 7,
    "September": 8,
    "October": 9,
    "November": 10,
    "December": 11
  };

  const monthIndex = monthIndices[monthName];
  if (monthIndex === undefined) {
    throw new Error("Invalid month name");
  }

  const startDate = new Date(year, monthIndex, 1)
  startDate.setDate(startDate.getDate() + 1)

  const endDate = new Date(year, monthIndex + 1, 0);
  endDate.setDate(endDate.getDate() + 1)
  return { endDate, startDate }
}
 
export const auto_total=(arr:DayDetail[])=>{
  const r:DayDetail[]= []
  arr.forEach(e=>{
      const tem: DayDetail= e
      const PulseAmount = e.items.Pulses.amount
      const Salt_SpicesAmount = e.items.Salt_Spices.amount
      const vegetablesAmount = e.items.vegetables.amount
      const Oli_ButterAmount = e.items.Oli_Butter.amount
      const FuelAmount = e.items.Fuel.amount
      tem.totalAmount=PulseAmount + Salt_SpicesAmount + vegetablesAmount + Oli_ButterAmount + FuelAmount
      r.push(tem)
  })
  return r
}

export const getDaysCount = (monthName: MonthName, year: number) => {
  const { startDate, endDate } = getMonthDates(monthName, year)
  let dayArray: number[] = [];
  let holidayArray: number[] = [];
  // List of Indian national holidays (format: "MM-DD")
  const indianHolidays = [
    "01-26", // Republic Day
    "08-15", // Independence Day
    "10-02", // Gandhi Jayanti
    // Add other holidays here...
  ];

  const CountElements = (ele: number, arr: number[]) => {
    let count = 0;
    arr.forEach(e => {
      if (e === ele) count++;
    });
    return count;
  };

  const isHoliday = (date: Date) => {
    const monthDay = `${("0" + (date.getMonth() + 1)).slice(-2)}-${("0" + date.getDate()).slice(-2)}`;
    return indianHolidays.includes(monthDay);
  };

  let i = new Date(startDate);
  while (i <= endDate) {
    let dayOfWeek = i.getDay();
    dayArray.push(dayOfWeek);
    if (isHoliday(i)) {
      holidayArray.push(dayOfWeek);
    }
    i.setDate(i.getDate() + 1);
  }

  let daysCount = {
    "Monday": CountElements(1, dayArray),
    "Tuesday": CountElements(2, dayArray),
    "Wednesday": CountElements(3, dayArray),
    "Thursday": CountElements(4, dayArray),
    "Friday": CountElements(5, dayArray),
    "Saturday": CountElements(6, dayArray),
    "Sunday": CountElements(0, dayArray),
    "TotalDays": dayArray.length,
    "MondayHolidays": CountElements(1, holidayArray),
    "TuesdayHolidays": CountElements(2, holidayArray),
    "WednesdayHolidays": CountElements(3, holidayArray),
    "ThursdayHolidays": CountElements(4, holidayArray),
    "FridayHolidays": CountElements(5, holidayArray),
    "SaturdayHolidays": CountElements(6, holidayArray),
    "SundayHolidays": CountElements(0, holidayArray)
  };

  return daysCount;
}
const totalExpenes_old = async (
  schoolId: mongoose.Types.ObjectId,
  Month: string,
  classType: string,
  Year: string,
  entry_date: Date 
) => {
  const data = await mongoose.model('RegisterEntry').aggregate([
    {
      $match: {
        schoolId: schoolId,
        Month: Month,
        classType: classType,
        Year: Year,
        entry_date: { $lte: entry_date }
      }
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: '$Total_expenses'
        },
        totalRice: {
          $sum: '$Used_Rice'
        }
      }
    }
  ])
  return data
}

export const correctRiceCalculation = async (entryId: mongoose.Types.ObjectId) => {
  const targetedEntry = <RegisterEntry>await RegisterEntryModel.findOne({ _id: entryId })
  const { classType, Month, Year, schoolId, entry_date ,Available_rice,Allotted_Rice,Available_amount} = targetedEntry
  const correctionEnteryList:RegisterEntry[] =await RegisterEntryModel.find({classType, Month, Year, schoolId, entry_date:{$gt: entry_date}})
  // console.log("correctionEnteryList------------------->",correctionEnteryList)
  if(correctionEnteryList.length>0){
    for(let e of correctionEnteryList){
      const a:Date=  e.entry_date
      const tem= await totalExpenes_old(schoolId, Month,classType, Year,  a);
      const Remaining_Rice  = (Available_rice + Allotted_Rice) - tem[0].totalRice 
      const Remaining_amount= Available_amount-tem[0].total
      await RegisterEntryModel.updateOne({_id:e._id},{$set:{Available_rice,Allotted_Rice,Remaining_Rice,Remaining_amount}})
      // console.log("tem-------------->",tem)
    }
  }

}


export const generateMonthlybill = async (SchoolId: string | mongoose.Types.ObjectId, school_type: string, Month: MonthName, year: number) => {
  const schoolDetails = <ISchool>await School.findOne({ _id: SchoolId })
  // console.log("billDataGeneration ------------->",schoolDetails)
  const query =[
    {
      $addFields:
      {
        year: {
          $year: "$entry_date",
        },
      },
    },
    {
      $match: {
        schoolId: new mongoose.Types.ObjectId(SchoolId),
        Month: Month,
        year: year
      },
    },
    {
      $group: {
        _id: "$classType",
        schoolId: {
          $first: "$schoolId",
        },
        Month: {
          $first: "$Month",
        },
        Year: {
          $first: "$year",
        },
        fridayCount: {
          $sum: {
            $cond: [
              {
                $eq: [
                  {
                    $dayOfWeek: "$entry_date",
                  },
                  6,
                ],
              },
              1,
              0,
            ],
          },
        },
        fridayStudentCount: {
          $sum: {
            $cond: [
              {
                $eq: [
                  {
                    $dayOfWeek: "$entry_date",
                  },
                  6,
                ],
              },
              "$No_of_students",
              0,
            ],
          },
        },
        sundayCount: {
          $sum: {
            $cond: [
              {
                $eq: [
                  {
                    $dayOfWeek: "$entry_date",
                  },
                  1,
                ],
              },
              1,
              0,
            ],
          },
        },
        sundayStudentCount: {
          $sum: {
            $cond: [
              {
                $eq: [
                  {
                    $dayOfWeek: "$entry_date",
                  },
                  1,
                ],
              },
              "$No_of_students",
              0,
            ],
          },
        },
        Dal_total_amount: {
          $sum: "$dal.amount",
        },
        Masala_Namak_total_amount: {
          $sum: "$Masala_Namak.amount",
        },
        SabjiSoyabeanSaladTotalAmount: {
          $sum: "$Sabji_Soyabean_salad.amount",
        },
        Tel_total_amount: {
          $sum: "$Tel.amount",
        },
        Jalawan_total_amount: {
          $sum: "$Jalawan.amount",
        },
        Total_expenses_amount: {
          $sum: "$Total_expenses",
        },
        "Used_Rice_total_Quantity_kg": {
          $sum: "$Used_Rice",
        },
      },
    },
    // {
    //   $lookup: {
    //     from: "schools",
    //     pipeline: [
    //       {
    //         $project: {
    //           Total_available_rice: {
    //             $sum: [
    //               "$avsheshChawa",
    //               "$prapt_chawal",
    //             ],
    //           },
    //           Available_rice: "$avsheshChawa",
    //           Alloted_rice: "$prapt_chawal",
    //           district: 1,
    //           block: 1,
    //           medium: 1,
    //         },
    //       },
    //     ],
    //     localField: "schoolId",
    //     foreignField: "_id",
    //     as: "BillTitleDetails",
    //   },
    // },
  ] 
  const billData = await RegisterEntryModel.aggregate(query)
  const BillTitleDetails = {
    Total_available_rice: schoolDetails.PrimaryClass_avsheshChawa +schoolDetails.MiddleClass_avsheshChawa + schoolDetails.PrimaryClass_prapt_chawal +schoolDetails.MiddleClass_prapt_chawal,
    Available_rice: schoolDetails.PrimaryClass_avsheshChawa +schoolDetails.MiddleClass_avsheshChawa ,
    Alloted_rice: schoolDetails.PrimaryClass_prapt_chawal +schoolDetails.MiddleClass_prapt_chawal,
    Available_amount:schoolDetails.avsheshRashi,
    district: schoolDetails.district,
    block: schoolDetails.block,
    medium: schoolDetails.medium,
    SchoolName: schoolDetails.schoolName,
    year,
    Month,
  }
  const data1 = billData.find(e => { return e._id === "PrimaryClass" })
  const data2 = billData.find(e => { return e._id === "MiddleClass" })

  const result = (!data2) ? { BillTitleDetails, "PrimaryClassBillData": data1 } : { BillTitleDetails, "PrimaryClassBillData": data1, "MiddleClassBillData": data2 }
  return result
  //add other rice details in  query result data 
  //Calculate total number of Fridays, Saturday, Sunday
}




// const url = req.protocol + '://' + req.get('host') + req.originalUrl.split('?').shift();
// const queryParams = Object.keys(req.query)
// .filter(key => key !== 'page' && key !== 'limit')
// .map(key => `${key}=${encodeURIComponent(req.query[key])}`) 
// .join('&');