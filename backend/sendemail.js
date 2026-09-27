const mongoose = require("mongoose")
const nodemailer = require("nodemailer")

const credentialsSchema = new mongoose.Schema(
  {
    user: String,
    name: String,
    pass: String
  },
  { collection: "bulkmail" }
)

const Credentials = mongoose.models.Credentials || mongoose.model("Credentials", credentialsSchema)
const emailPattern = /^[^\s@]+@gmail\.com$/i
const recipientPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function connectToDatabase() {
  if (mongoose.connection.readyState === 1) return
  if (mongoose.connection.readyState === 2) {
    await mongoose.connection.asPromise()
    return
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is required")
  }

  await mongoose.connect(process.env.MONGODB_URI)
}

async function getMailCredentials() {
  const records = await Credentials.find().lean()
  const record = records.find((item) => {
    const email = [item.user, item.name].find((value) =>
      typeof value === "string" && emailPattern.test(value.trim())
    )
    return email && typeof item.pass === "string" && item.pass.trim()
  })

  if (!record) {
    throw new Error("No valid Gmail credentials found in the bulkmail collection")
  }

  const user = [record.user, record.name].find((value) =>
    typeof value === "string" && emailPattern.test(value.trim())
  ).trim()

  return { user, pass: record.pass.replace(/\s+/g, "") }
}

module.exports = async function sendEmail(req, res) {
  const message = req.body?.msg ?? req.body?.message
  const emailList = req.body?.emailList ?? req.body?.mailist ?? req.body?.mailList

  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ success: false, message: "Message is required" })
  }

  if (!Array.isArray(emailList) || emailList.length === 0) {
    return res.status(400).json({ success: false, message: "Email list is required" })
  }

  const recipients = emailList.map((email) => String(email).trim())
  if (recipients.some((email) => !recipientPattern.test(email))) {
    return res.status(400).json({ success: false, message: "The email list contains an invalid address" })
  }

  try {
    await connectToDatabase()
    const { user, pass } = await getMailCredentials()
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass }
    })

    for (const recipient of recipients) {
      await transporter.sendMail({
        from: user,
        to: recipient,
        subject: "Message from BulkMail",
        text: message
      })
    }

    return res.json({ success: true, message: "Emails sent successfully" })
  } catch (error) {
    console.error("Email error:", error.message)
    return res.status(500).json({ success: false, message: error.message || "Failed to send emails" })
  }
}