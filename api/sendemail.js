const sendEmail = require("../backend/sendemail")

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST")
    return res.status(405).json({ success: false, message: "Method not allowed" })
  }

  return sendEmail(req, res)
}
