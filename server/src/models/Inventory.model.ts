import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  itemCode: string;
  name: string;
  category: 'Furniture' | 'Electronics' | 'Sports' | 'Laboratory' | 'Library' | 'Office' | 'Other';
  description?: string;
  quantity: number;
  availableQuantity: number;
  unit?: string;
  condition: 'New' | 'Good' | 'Fair' | 'Damaged' | 'Disposed';
  location?: string;
  purchaseDate?: Date;
  purchasePrice?: number;
  supplier?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    itemCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Furniture', 'Electronics', 'Sports', 'Laboratory', 'Library', 'Office', 'Other'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    availableQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      trim: true,
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Damaged', 'Disposed'],
      required: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
    },
    purchaseDate: Date,
    purchasePrice: {
      type: Number,
      min: 0,
    },
    supplier: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

InventoryItemSchema.pre('save', function (next) {
  if (this.availableQuantity > this.quantity) {
    this.availableQuantity = this.quantity;
  }
  next();
});

export const InventoryItem = mongoose.model<IInventoryItem>('InventoryItem', InventoryItemSchema);
