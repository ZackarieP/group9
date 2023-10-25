import fs from "fs";

const indexName = "search-google-books";

function convertToBulkJson(jsonData, indexName) {
  const bulkJson = [];
  jsonData.forEach((doc, docId) => {
    const indexMetadata = {
      index: {
        _index: indexName,
        _id: docId.toString(),
      },
    };
    bulkJson.push(JSON.stringify(indexMetadata));
    bulkJson.push(JSON.stringify(doc));
  });
  return bulkJson.join("\n") + "\n";
}

// Read JSON data from file
fs.readFile("google.json", "utf8", (err, data) => {
  if (err) {
    console.error("Error reading the file:", err);
  } else {
    try {
      const jsonData = JSON.parse(data);
      const bulkJsonData = convertToBulkJson(jsonData, indexName);
      console.log("Bulk JSON data:", bulkJsonData);

      // Now you can use bulkJsonData to send the data to Elasticsearch using the Bulk API.
      // Add the Elasticsearch indexing code here.

      fs.writeFile("google_bulk_data.json", bulkJsonData, "utf8", (err) => {
        if (err) {
          console.error("Error writing to file:", err);
        } else {
          console.log("Bulk JSON data written to bulk_data.json successfully.");
        }
      });
    } catch (parseError) {
      console.error("Error parsing JSON data:", parseError);
    }
  }
});
