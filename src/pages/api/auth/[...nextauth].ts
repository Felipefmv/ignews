import NextAuth from "next-auth"
import Providers from "next-auth/providers"

const { MongoClient } = require("mongodb")

async function findUser (client, email) {
    const userLogin = {email: email}
    const result = await client.db("ignews").collection("users").findOne(userLogin)

    if(!result) {
        await client.db("ignews").collection("users").insertOne(userLogin)
    }
}

export default NextAuth({
  // Configure one or more authentication providers
  providers: [
    Providers.GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      scope: 'read-user'
    })
  ],
  callbacks: {
    async signIn(user, account, profile) {
        const { email } = user
        
        const uri = process.env.MONGODB_URI
        const client = new MongoClient(uri)
        
        try{
            await client.connect()
            await findUser(client,email)            

            return true
        }catch{
            return false
        }finally {
            await client.close()
        }
    }}
})