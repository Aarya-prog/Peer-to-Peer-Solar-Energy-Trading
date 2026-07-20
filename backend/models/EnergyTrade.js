import mongoose from 'mongoose';

const energyTradeSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    unitsKwh: {
      type: Number,
      required: [true, 'Please specify units in kWh'],
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Please specify price per unit'],
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Listed', 'Completed', 'Cancelled'],
      default: 'Listed',
    },
  },
  { timestamps: true }
);

const EnergyTrade = mongoose.model('EnergyTrade', energyTradeSchema);
export default EnergyTrade;
