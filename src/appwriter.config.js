import {Client, TablesDB, ID} from "appwrite"

const config = {
    endpoint: "https://fra.cloud.appwrite.io/v1",
    projectId: "6919053000358860a8f4",
    databaseId: "69190941003e3e7c48ab",
    tableTaskId: "task",
    tableHabitId: "habit",
    tableNoteId: "note"
}

const client = new Client()

client.setEndpoint(config.endpoint)
client.setProject(config.projectId)
  

const tables = new TablesDB(client)


export {client, tables, ID, config }
