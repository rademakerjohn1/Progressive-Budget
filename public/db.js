let db;

// Create a request for a "budget" db
const request = indexedDB.open("budget", 1);

// Create an auto-incrementing object store "pending" in db
request.onupgradeneeded = function(event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// If app is online, check db for entries
request.onsuccess = function(event) {
  db = event.target.result;
  if (navigator.onLine) {
    checkDatabase();
  }
};

// Log error if error
request.onerror = function(event) {
  console.log("Error: " + event.target.errorCode);
};

// Create transaction with readwrite access on "pending"
// Access object store and add data from form
// This function is called in index.js if app is offline
function saveRecord(record) {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  store.add(record);
}


// Create transaction with readwrite access, access "pending", get all entries
// If there are any entries, post to /api/transaction/bulk
// Create another transaction to clear entries from the db
// This is called whenever the app comes back online
function checkDatabase() {
  const transaction = db.transaction(["pending"], "readwrite");
  const store = transaction.objectStore("pending");
  const getAll = store.getAll();
  getAll.onsuccess = function() {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
      .then(response => response.json())
      .then(() => {
        const transaction = db.transaction(["pending"], "readwrite");
        const store = transaction.objectStore("pending");
        store.clear();
      });
    }
  };
}

// Run checkDatabase when app comes online
window.addEventListener("online", checkDatabase);
