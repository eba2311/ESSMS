import mongoose, { Schema, Document } from 'mongoose';

export interface IBorrowing extends Document {
  borrowingId: string;
  book: mongoose.Types.ObjectId;
  borrower: mongoose.Types.ObjectId;
  borrowerType: 'Student' | 'Teacher';
  issueDate: Date;
  dueDate: Date;
  returnDate?: Date;
  fine: number;
  finePerDay: number;
  status: 'Borrowed' | 'Returned' | 'Overdue';
  issuedBy: mongoose.Types.ObjectId;
  returnedTo?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BorrowingSchema = new Schema<IBorrowing>(
  {
    borrowingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      required: true,
      index: true,
    },
    borrower: {
      type: Schema.Types.ObjectId,
      refPath: 'borrowerType',
      required: true,
      index: true,
    },
    borrowerType: {
      type: String,
      enum: ['Student', 'Teacher'],
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    returnDate: Date,
    fine: {
      type: Number,
      default: 0,
      min: 0,
    },
    finePerDay: {
      type: Number,
      default: 2,
      min: 0,
    },
    status: {
      type: String,
      enum: ['Borrowed', 'Returned', 'Overdue'],
      default: 'Borrowed',
      index: true,
    },
    issuedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    returnedTo: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
BorrowingSchema.index({ borrower: 1, status: 1 });
BorrowingSchema.index({ book: 1, status: 1 });

// Generate unique borrowing ID
BorrowingSchema.pre('save', async function (next) {
  if (this.isNew && !this.borrowingId) {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    this.borrowingId = `BRW${year}${random}`;
  }
  
  // Calculate fine on return if overdue
  if (this.returnDate && !this.isModified('fine')) {
    const today = this.returnDate;
    const due = new Date(this.dueDate);
    
    if (today > due) {
      const daysOverdue = Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
      this.fine = daysOverdue * this.finePerDay;
    }
  }
  
  // Update status
  if (this.returnDate) {
    this.status = 'Returned';
  } else if (new Date() > this.dueDate) {
    this.status = 'Overdue';
  }
  
  next();
});

export const Borrowing = mongoose.model<IBorrowing>('Borrowing', BorrowingSchema);
