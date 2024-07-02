import { ObjectId } from 'bson';
import mongoose from 'mongoose';
import { Admin } from '../services/Interfaces'

const AdminSchema = new mongoose.Schema<Admin>({
    userName: { type: String, required: true },
    password: { type: String, required: true },
    // Define other fields here if needed
});

const AdminModel = mongoose.model<Admin>('Admin', AdminSchema);

export { AdminModel, Admin };
