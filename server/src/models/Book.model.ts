import mongoose, { Schema, Document } from 'mongoose';

export interface IBook extends Document {
  isbn?: string;
  title: string;
  author: string;
  category: string;
  publisher?: string;
  publicationYear?: number;
  quantity: number;
  availableCopies: number;
  location?: string;
  addedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    isbn: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    author: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    publisher: {
      type: String,
      trim: true,
    },
    publicationYear: Number,
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableCopies: {
      type: Number,
      required: true,
      min: 0,
    },
    location: String,
    addedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure available copies don't exceed quantity
BookSchema.pre('save', function (next) {
  if (this.availableCopies > this.quantity) {
    this.availableCopies = this.quantity;
  }
  next();
});

export const Book = mongoose.model<IBook>('Book', BookSchema);
