import dotenv from "dotenv";
dotenv.config();

const {TOKEN, CLIENT_ID, GUILD_ID} = process.env;


if (!TOKEN || !CLIENT_ID) {
    throw new Error("Missing enviroment variables")
}

export const config = {
    TOKEN,
    CLIENT_ID, 
    GUILD_ID
}