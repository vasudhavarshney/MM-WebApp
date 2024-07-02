import { PaginateModel, PaginateOptions, PaginateResult, PaginateDocument } from 'mongoose-paginate-v2';

declare module 'mongoose' {
  interface PaginateModel<T extends Document> extends Model<T> {
    paginate: (query?: any, options?: PaginateOptions, callback?: (err: any, result: PaginateResult<T>) => void) => Promise<PaginateResult<T>>;
  }
}
