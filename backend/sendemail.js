const mongoose = require("mongoose")
const nodemailer = require("nodemailer")

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb://sakthivelmurugadass_db_user:CiURoreWomGONPSG@ac-qhleom6-shard-00-00.orzutxj.mongodb.net:27017,ac-qhleom6-shard-00-01.orzutxj.mongodb.net:27017,ac-qhleom6-shard-00-02.orzutxj.mongodb.net:27017/bulkmail?ssl=true&replicaSet=atlas-1mind8-shard-0&authSource=admin&appName=Cluster0"

const credentialsSchema = new mongoose.Schema(
  {
    user: String,
    name: String,
    pass: String
  },
  { collection: "passkey" }
)

const Credentials = mongoose.models.Credentials || mongoose.model("Credentials", credentialsSchema)

const emailPattern = /^[^\s@]+@gmail\.com$/i
const recipientPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) {
    console.log("DB connected")
    return
  }

  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise()
    console.log("DB connected")
    return
  }

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable or connection string is missing")
  }

  await mongoose.connect(MONGODB_URI, { family: 4 })
  console.log("DB connected")
}

async function getMailCredentials() {
  const records = await Credentials.find().lean()

  const record = records.find((item) => {
    const email = [item.user, item.name].find(
      (val) => typeof val === "string" && emailPattern.test(val.trim())
    )
    return email && typeof item.pass === "string" && item.pass.trim()
  })

  if (!record) {
    throw new Error("No valid Gmail credentials found in database")
  }

  const user = [record.user, record.name]
    .find((val) => typeof val === "string" && emailPattern.test(val.trim()))
    .trim()

  const pass = record.pass.replace(/\s+/g, "") // Clean spaces from App Password

  return { user, pass }
}

async function getTransporter() {
  const { user, pass } = await getMailCredentials()
  return {
    user,
    transporter: nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    })
  }
}

module.exports = async function sendEmail(req, res) {
  try {
    console.log("Received /sendemail request payload:", req.body)

    const message = req.body?.msg ?? req.body?.message
    const emailList = req.body?.emailList ?? req.body?.mailist ?? req.body?.mailList

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ success: false, message: "Message content cannot be empty" })
    }

    if (!Array.isArray(emailList) || emailList.length === 0) {
      return res.status(400).json({ success: false, message: "Email list must be a non-empty array" })
    }

    const validRecipients = []
    const invalidRecipients = []

    for (const rawEmail of emailList) {
      const email = String(rawEmail || "").trim()
      if (email && recipientPattern.test(email)) {
        validRecipients.push(email)
      } else {
        invalidRecipients.push(rawEmail)
      }
    }

    if (validRecipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid recipient email addresses were provided",
        invalidEmails: invalidRecipients
      })
    }

    await connectToDatabase()
    const { user, transporter } = await getTransporter()

    const sendPromises = validRecipients.map((recipient) =>
      transporter.sendMail({
        from: user,
        to: recipient,
        subject: "Message from BulkMail",
        text: message
      })
    )

    const results = await Promise.allSettled(sendPromises)

    const fulfilled = results.filter((r) => r.status === "fulfilled")
    const rejected = results.filter((r) => r.status === "rejected")

    if (fulfilled.length === 0) {
      const firstError = rejected[0]?.reason?.message || "All email deliveries failed"
      return res.status(500).json({ success: false, message: firstError })
    }

    return res.json({
      success: true,
      message: `Successfully sent ${fulfilled.length} out of ${validRecipients.length} emails`,
      sentCount: fulfilled.length,
      failedCount: rejected.length,
      invalidEmails: invalidRecipients
    })
  } catch (error) {
    console.error("Bulk Mail API Error:", error.message)
    return res.status(500).json({
      success: false,
      message: error.message || "An unexpected error occurred while sending emails"
    })
  }
}