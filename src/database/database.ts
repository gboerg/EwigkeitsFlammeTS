import {PrismaClient} from "../../generated/prisma/index.js" 
import {PrismaBetterSQLite3} from "@prisma/adapter-better-sqlite3" 
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname in ES Modules erzeugen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("IAM A DATABASE ts file")

const adapter = new PrismaBetterSQLite3({
    url : path.join(__dirname, 'bot.db'),

})

let p = new PrismaClient({ adapter}) 


// async function main() {
//     await prisma.user.create({
//         data: {
//             guild_id: "23237346734",
//             user_id: "322372362873",
//             is_banned: false
//         }
//     })
    
// }


// // 4
// main()
//   .then(async () => {
//     await prisma.$disconnect()
//   })
//   .catch(async (e) => {
//     console.error(e)
//     // 5
//     await prisma.$disconnect()
//     process.exit(1)
//   })



export default p


// async function addDBEntry(db_name: string, ) {
//     prisma[db_name]
// }
// // prisma.


// addDBEntry()