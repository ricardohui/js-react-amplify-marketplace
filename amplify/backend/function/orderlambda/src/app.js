/*
Copyright 2017 - 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
Licensed under the Apache License, Version 2.0 (the "License"). You may not use this file except in compliance with the License. A copy of the License is located at
    http://aws.amazon.com/apache2.0/
or in the "license" file accompanying this file. This file is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and limitations under the License.
*/

var express = require("express");
var bodyParser = require("body-parser");
var awsServerlessExpressMiddleware = require("aws-serverless-express/middleware");
var AWS = require("aws-sdk");
require("dotenv").config();
var stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const config = {
  region: "us-west-2",
  adminEmail: "account@ricardohui.com",
  accessKeyId: "AKIARZVFEYKOCZWEIING",
  secretAccessKey: "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"
};

var ses = new AWS.SES(config);

// declare a new express app
var app = express();
app.use(bodyParser.json());
app.use(awsServerlessExpressMiddleware.eventContext());

// Enable CORS for all methods
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

const chargeHandler = async (req, res, next) => {
  const { token } = req.body;
  const { currency, amount, description } = req.body.charge;

  try {
    const charge = await stripe.charges.create({
      source: token.id,
      amount,
      currency,
      description
    });
    if (charge.status === "succeeded") {
      req.charge = charge;
      req.description = description;
      req.email = req.body.email;
      next();
    }
    // res.json(charge);
  } catch (err) {
    res.status(500).json({ error: err });
  }
};

const convertCentsToDollars = price => (price / 100).toFixed(2);

const emailHandler = (req, res) => {
  const {
    charge,
    description,
    email: { shipped, customerEmail, ownerEmail }
  } = req;
  ses.sendEmail(
    {
      Source: config.adminEmail,
      ReturnPath: config.adminEmail,
      Destination: {
        ToAddresses: [config.adminEmail, ownerEmail, customerEmail]
      },
      Message: {
        Subject: {
          Data: "Order Details - Marketplace"
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `<h3>Order Processed!</h3>
            <p><span style="font-weight: bold">${description}</span> - $${convertCentsToDollars(
              charge.amount
            )}</p>
            <p>Customer Email: <a href="mailto:${customerEmail}">${customerEmail}</a></p>
            <p>Contact your seller: <a href="${ownerEmail}">${ownerEmail}</a></p>
            
            ${
              shipped
                ? `<h4>Mailing Address</h4><p>${charge.source.name}</p><p>${
                    charge.source.address_line1
                  }</p><p>${charge.source.address_city}, ${
                    charge.source.address_state
                  } ${charge.source.address_zip}</p>`
                : "Email product"
            }
            

            <p style="font-style: italic; color: grey;">
              ${
                shipped
                  ? "Your product will be shipped in 2-3 days"
                  : "Check your verified email for your email product"
              }
            </p>


            `
          }
        }
      }
    },
    (err, data) => {
      if (err) {
        return res.status(500).json({ error: err });
      }
      res.json({ message: "Order processed successfully", charge, data });
    }
  );
};
/****************************
 * Example post method *
 ****************************/

app.post("/items", chargeHandler, emailHandler);

app.listen(3000, function() {
  console.log("App started");
});

// Export the app object. When executing the application local this does nothing. However,
// to port it to AWS Lambda we will create a wrapper around that will load the app from
// this file
module.exports = app;
