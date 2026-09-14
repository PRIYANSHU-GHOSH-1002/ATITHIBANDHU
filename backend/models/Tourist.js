const mongoose = require('mongoose');

const TouristSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    passwordReference: {type: String,default: null},
    phone: { type: String, required: true },
    nationality: { type: String, required: true },
    idNumber: { type: String, required: true }, // passport / national ID
    emergencyContact: {
      name: String,
      phone: String,
    },
    role: { type: String, enum: ['tourist', 'admin', 'responder'], default: 'tourist' },
    digitalId: {
      chainIndex: Number,
      hash: String, // hash of the genesis block for this tourist's ID
    },
    currentLocation: {
      lat: Number,
      lng: Number,
      updatedAt: Date,
    },
    tripStart: { type: Date, default: Date.now },
    tripEnd: { type: Date }, // planned trip end - digital ID can be set to expire
    status: { type: String, enum: ['active', 'inactive', 'sos'], default: 'active' },
  },
  { timestamps: true }
);

// --------------------------------------------------
// Normalize phone numbers to E.164 before saving
// --------------------------------------------------
TouristSchema.pre('save', function (next) {
  if (this.isModified('phone') && this.phone) {
    this.phone = normalizeToE164(this.phone);
  }
  if (this.isModified('emergencyContact.phone') && this.emergencyContact?.phone) {
    this.emergencyContact.phone = normalizeToE164(this.emergencyContact.phone);
  }
  next();
});

function normalizeToE164(number) {
  const digits = number.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+91${digits}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits}`;
  }
  if (number.startsWith('+')) {
    return number; // already normalized
  }
  return `+${digits}`; // fallback for other country codes
}

module.exports = mongoose.model('Tourist', TouristSchema);
