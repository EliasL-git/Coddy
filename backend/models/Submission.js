const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lessonId: { type: String, required: true },
    challengeId: { type: String, required: true },
    language: { type: String, required: true },
    code: { type: String, required: true },
    isValid: { type: Boolean, required: true },
    feedback: { type: String },
    aiPowered: { type: Boolean, default: false },
    timestamp: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
