import { NextApiRequest, NextApiResponse } from "next";
import { stripe } from "../../services/stripe";
import { getSession } from "next-auth/client";

const { MongoClient } = require("mongodb")
const uri = process.env.MONGODB_URI
const client = new MongoClient(uri)



export default async (req: NextApiRequest, res: NextApiResponse)=>{
    if (req.method === "POST"){
        const session = await getSession({ req })


        const userLogin = {email: session.user.email}
        await client.connect() 
        const user = await client.db("ignews").collection("users").findOne(userLogin)
        
        let customerId = user.stripe_customer_id

        if(!customerId) {
            const stripeCustomer = await stripe.customers.create({ 
                email: session.user.email
            })
            
            await client.db("ignews").collection("users").updateOne({ email: user.email},{$set:{ stripe_customer_id: stripeCustomer.id}})
        
            customerId = stripeCustomer.id
        }
                   

              
        const stripeCheckoutSessions = await stripe.checkout.sessions.create({
            customer: customerId,
            payment_method_types:['card'],
            billing_address_collection: 'required',
            line_items: [{price: 'price_1JfsD9AgkwOvrHKC3zJPcp6Y', quantity: 1}],
            mode: 'subscription',
            allow_promotion_codes: true,
            success_url: process.env.STRIPE_SUCCESS_URL,
            cancel_url: process.env.STRIPE_CANCEL_URL
        })
        return res.status(200).json({sessionId: stripeCheckoutSessions.id});
    }else{
        res.setHeader('Allow','POST')
        res.status(405).end('Method not allowed')
    }
}