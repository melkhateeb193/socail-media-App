import { EventEmitter } from "events";
import { sendEmail } from "../../service/sendEmail.js";
import { nanoid ,customAlphabet } from 'nanoid'
import { userModel } from "../../DB/models/index.js";
import { Hash } from "../encryption/index.js";
import { html } from "../../service/tempalte.email.js";
export const eventEmitter = new EventEmitter();



eventEmitter.on("sendEmailConfirmation", async (data) => {
  const { email } = data;
  // generate otp

  const otp = customAlphabet("0123456789",6)()
  const hash = await Hash({key:otp , SALT_ROUNDS: process.env.SALT_ROUNDS})
  await userModel.updateOne({email},{otpEmail:hash})
console.log(otp)
 await sendEmail(email,"confirm Email","confirmarion otp",html({otp}));
});
eventEmitter.on("confirmNewEmail", async (data) => {
  const { email } = data;
  // generate otp
  const otp = customAlphabet("0123456789",6)()
  const hash = await Hash({key:otp , SALT_ROUNDS: process.env.SALT_ROUNDS})
  await userModel.updateOne({email},{otpNewEmail:hash})
console.log(otp)
 await sendEmail(email,"confirm Email","confirmarion otp",html({otp}));
});

eventEmitter.on("forgetPassword", async (data) => {
  const { email } = data;
  // generate otp

  const otp = customAlphabet("0123456789",6)()
  const hash = await Hash({key:otp , SALT_ROUNDS: process.env.SALT_ROUNDS})
  await userModel.updateOne({email},{otpPassword:hash})
console.log(otp)
 await sendEmail(email,"forget password","confirmarion otp",html({otp}));
});


eventEmitter.on("sendProfileViewEmail", ({ recipientEmail, viewerName, viewTimes }) => {
  const emailBody = `${viewerName} has viewed your account 5 times at these times: ${viewTimes.map(date => new Date(date).toLocaleString()).join(", ")}`;

  sendEmail({
    to: recipientEmail,
    subject: "Frequent Profile Views Alert",
    text: emailBody,
  });
});