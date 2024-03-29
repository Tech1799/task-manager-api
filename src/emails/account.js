const sgMail = require('@sendgrid/mail')

sgMail.setApiKey(process.env.SENDGRID_API_KEY)

const sendWelcomeEmail = (email, name) =>{
    sgMail.send({
        to: email,
        from: 'bhupindersharma1799@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. let me know how you get along with the app.`
    })
}

const sendCancelEmail = (email, name) => {
    sgMail.send({
      to: email,
      from: 'bhupindersharma1799@gmail.com',
      subject: 'Tell us why you want to leave!!',
      text: `Goodbye, ${name}. I hope to see you back sometime soon.`  
    })
}

module.exports = {
    sendWelcomeEmail,
    sendCancelEmail
}