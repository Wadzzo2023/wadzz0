import { Server } from "stellar-sdk";
import { STELLAR_URL } from "../constant";

export async function accountDetails({ userPub }: { userPub: string }) {
  const server = new Server(STELLAR_URL);

  const transactionInializer = await server.loadAccount(userPub);
  console.log("acc", transactionInializer);
}
