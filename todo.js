// Create needed constants
const list = document.querySelector('ul');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');


// Create an instance of a db object for storing the open database
let db;

// adding an event handler 
window.onload = function() {
    // Opening the database(if does not exist; creates one)
    let request = window.indexedDB.open('notes_db', 1);
    
    // onerror handler to signify database opening failed
    request.onerror = function() {
        console.log('Datbase failed to open');
    };

    request.onsuccess = function() {
        console.log('Database opened successfully');

        // Storing the opened database object in the db variable

        db = request.result;
        displayData();
    };
    request.onupgradeneeded = function(e) {
        let db = e.target.result;
        // it is similar to the request.result(does the same thing)
        
        // Creating an objectStore to store our notes also
        // adding an auto incrementing key;
        let objectStore = db.createObjectStore('notes_os', {
            keyPath: 'id',
            autoIncrement: true
        });
        //Defining the data items the objectStore will contain
        objectStore.createIndex('title', 'title', {unique: false});
        objectStore.createIndex('body', 'body', {unique: false});
        
        console.log('Database setup complete');
    };

    // Adding data to the database
    // create a onsubmit handler to submit data when event is fired
    form.onsubmit = addData;

    function addData(e) {
        e.preventDefault();

        // grab the values entered into the form fields and
        // storing them in newItem variable
        let newItem = {
            title: titleInput.nodeValue,
            body: bodyInput.value
        };

        // open a read/write db transaction for adding the data.
        let transaction = db.transaction(['notes_os'], 'readwrite');

        // call an object store that has already been added to the database.
        let objectStore = transaction.objectStore('notes_os');

        // MAke a request to add our newItem object to the object store.
        let request = objectStore.add(newItem);

        request.onsuccess = function() {
            titleInput.value = '';
            bodyInput.value = '';
        };

        transaction.oncomplete = function() {
            console.log('Transaction completed: database modification completed.');
            
            displayData();
        };
        transaction.onerror = function() {
            console.log('Transaction failed: could no load database');
        };
    }

    function displayData() {
        //empty the contents each time to prevent duplicates listing each time
        while(list.firstChild) {
            list.removeChild(list.firstChild);
        }

        // Open the object store and then get a cursor(iterates through
        // all the data items in the store)

        let objectStore = db.transaction('notes_os').objectStore('notes_os');
        objectStore.openCursor().onsuccess = function(e) {
            // Get a reference to the cursor
            let cursor = e.target.result;
            // if there is still another data item to iterate through, keep running the code
            if(cursor) {
                const listItem = document.createElement('li');
                const h3 = document.createElement('h3');
                const para = document.createElement('p');

                list.appendChild(h3);
                list.appendChild(para);
                list.appendChild(listItem);

                // Put the data from the cursor inside the h3 and para;
                h3.textContent = cursor.value.title;
                para.textContent = cursor.value.body;

                // Store the ID of the data item inside an attribute on the listItem, so
                // we know which item corresponds to.
                listItem.setAttribute('data-node-id', cursor.value.id);

                // Create a button and place it inside each listItem
                const deleteBtn = document.createElement('button');
                listItem.appendChild(deleteBtn);
                deleteBtn.textContent = 'Delete';
                // Setting an event handler 
                deleteBtn.onclick = deleteItem;

                // Insert to the next item in the cursor
                cursor.continue();

            } else {
                if(!list.firstChild) {
                    const listItem = document.createElement('li');
                    listItem.textContent = 'No notes stored';
                    list.appendChild(listItem);

                    console.log('Notes all displayed');
                }
            }   
        };
    }
    // Deleting an item
    function deleteItem(e) {
        // retreiving the name of the task we want to delete.
        // Convert it to a number before trying to use it with IDB
        // IDB key values are type-sensitive
        let noteId = Number(e.target.parentNode.getAttribute('data-node-id'));

        // open a database transaction and delete the task, finding it using the id we retreived above
        let transaction= db.transaction(['notes_os'], 'readwrite');
        let objectStore = transaction.objectStore('notes_os');
        let request = objectStore.delete(noteId);

        // report that the data item has been deleted.
        transaction.oncomplete = function() {
            e.target.parentNode.parentNode.removeChild(e.target.parentNode);
            console.log('Note' + noteId + 'deleted');
            
            if(!firstChild) {
                let listItem = document.createElement('li');
                listItem.textContent = 'No notes stored';
                list.appendChild(listItem)
            }
        };
    }
}