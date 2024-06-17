import axios from "axios";
import mysql from "mysql2/promise";
import config from "../config.json";

const API_KEY = config.api_keys;
const USDT_CONTRACT_ADDRESS = '0xdac17f958d2ee523a2206206994597c13d831ec7';
const endpoint = "https://api.etherscan.io/api";
// const ENDPOINT = "https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=0xdac17f958d2ee523a2206206994597c13d831ec7&page=1&offset=100&startblock=0&endblock=27025780&sort=asc&apikey=AATYZ1K4NP7AGW299HPD79KCJRYRTB8BIN&address=0x36928500bc1dcd7af6a2b4008875cc336b927d57";

interface Transaction {
  blockNumber: string;
  timeStamp: string;
  hash: string;
  from: string;
  to: string;
  value: string;
}

const params: any = {
  module: "account",
  action: "tokentx",
  contractaddress: "0xdac17f958d2ee523a2206206994597c13d831ec7", 
  address: "0x36928500bc1dcd7af6a2b4008875cc336b927d57",
  page: 1,
  offset: 100,
  startblock: 0,
  endblock: 27025780,
  sort: "asc",
  apikey: "AATYZ1K4NP7AGW299HPD79KCJRYRTB8BIN"

};



async function fetchTransactions(): Promise<Transaction[]> {
  try {
    const response = await axios.get(endpoint, {
      params: params,
    });
    if (response.data.status !== '1') {
      throw new Error('Failed to fetch transactions');
    }
    return response.data.result as Transaction[];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
}

async function insertTransactionsIntoDatabase(transactions: Transaction[]): Promise<void> {
  const connection = await mysql.createConnection(config.database);

  const sql = `
    INSERT INTO usdt_transactions (block_number, timestamp, hash, from_address, to_address, value)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  const values = transactions.map(tx => [
    tx.blockNumber,
    tx.timeStamp,
    tx.hash,
    tx.from,
    tx.to,
    tx.value
  ]);

  try {
    await connection.beginTransaction();
    for (const value of values) {
      await connection.query(sql, value);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error('Error inserting transactions into database:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

async function main(): Promise<void> {
  try {
    const transactions = await fetchTransactions();
    await insertTransactionsIntoDatabase(transactions);
    console.log('Transactions successfully inserted into database');
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();
