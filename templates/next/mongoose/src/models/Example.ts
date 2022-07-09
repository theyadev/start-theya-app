import { Schema, Document, Model, model, models } from "mongoose";

/**
 * Base interface for the anime schama, contains the common properties
 */
export interface IExample {
  username: string; //Anilist username
  message: string;
}

/**
 * Interface for the anime document, contains all the property of a mongodb document
 * Can be use to add custom methods
 */
export interface IExampleDocument extends IExample, Document {

}

/**
 * Interface for the anime model, contains all the property of a mongodb model
 * Can be use to add static methods
 */
export interface IExampleModel extends Model<IExampleDocument> {

}

const ExampleSchema = new Schema<IExampleDocument>({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  message: {
    type: String,
    required: true,
  }
});

/**
 * Custom methods
 */

ExampleSchema.methods = {
  
};

/**
 * Static methods
 */

ExampleSchema.statics = {
 
};

export default models.List
  ? model<IExampleDocument, IExampleModel>("Example")
  : model<IExampleDocument, IExampleModel>("Example", ExampleSchema);
