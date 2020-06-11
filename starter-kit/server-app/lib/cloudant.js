const Cloudant = require('@cloudant/cloudant');

const cloudant_id = process.env.CLOUDANT_ID || '<cloudant_id>'
const cloudant_apikey = process.env.CLOUDANT_IAM_APIKEY || '<cloudant_apikey>';

// UUID creation
const uuidv4 = require('uuid/v4');

var cloudant = new Cloudant({
    account: cloudant_id,
    plugins: {
      iamauth: {
        iamApiKey: cloudant_apikey
      }
    }
  })

// Cloudant DB reference
let db;
let db_name = "community_db";

/**
 * Connects to the Cloudant DB, creating it if does not already exist
 * @return {Promise} - when resolved, contains the db, ready to go
 */
const dbCloudantConnect = () => {
    return new Promise((resolve, reject) => {
        Cloudant({  // eslint-disable-line
            account: cloudant_id,
                plugins: {
                    iamauth: {
                        iamApiKey: cloudant_apikey
                    }
                }
        }, ((err, cloudant) => {
            if (err) {
                console.log('Connect failure: ' + err.message + ' for Cloudant ID: ' +
                    cloudant_id);
                reject(err);
            } else {
                cloudant.db.list().then((body) => {
                    if (!body.includes(db_name)) {
                        console.log('DB Does not exist..creating: ' + db_name);
                        cloudant.db.create(db_name).then(() => {
                            if (err) {
                                console.log('DB Create failure: ' + err.message + ' for Cloudant ID: ' +
                                cloudant_id);
                                reject(err);
                            }
                        })
                    }
                    let db = cloudant.use(db_name);
                    console.log('Connect success! Connected to DB: ' + db_name);
                    resolve(db);
                }).catch((err) => { console.log(err); reject(err); });
            }
        }));
    });
}

// Initialize the DB when this module is loaded
(function getDbConnection() {
    console.log('Initializing Cloudant connection...', 'getDbConnection()');
    dbCloudantConnect().then((database) => {
        console.log('Cloudant connection initialized.', 'getDbConnection()');
        db = database;
    }).catch((err) => {
        console.log('Error while initializing DB: ' + err.message, 'getDbConnection()');
        throw err;
    });
})();

/**
 * Find all resources that match the specified partial name.
 * 
 * @param {String} type
 * @param {String} partialName
 * @param {String} userID
 * 
 * @return {Promise} Promise - 
 *  resolve(): all resource objects that contain the partial
 *          name, type or userID provided, or an empty array if nothing
 *          could be located that matches. 
 *  reject(): the err object from the underlying data store
 */
function find(type, partialName, userID) {
    return new Promise((resolve, reject) => {
        let selector = {}
        if (type) {
            selector['type'] = type;
        }
        if (partialName) {
            let search = `(?i).*${partialName}.*`;
            selector['name'] = {'$regex': search};

        }
        if (userID) {
            selector['userID'] = userID;
        }
        
        db.find({ 
            'selector': selector
        }, (err, documents) => {
            if (err) {
                reject(err);
            } else {
                resolve({ data: JSON.stringify(documents.docs), statusCode: 200});
            }
        });
    });
}

/**
 * Delete a resource that matches a ID.
 * 
 * @param {String} id
 * 
 * @return {Promise} Promise - 
 *  resolve(): Status code as to whether to the object was deleted
 *  reject(): the err object from the underlying data store
 */
function deleteById(id, rev) {
    return new Promise((resolve, reject) => {
        db.get(id, (err, document) => {
            if (err) {
                resolve(err.statusCode);
            } else {
                db.destroy(id, document._rev, (err) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(200);
                    }
                })
            }            
        })
    });
}

/**
 * Create a resource with the specified attributes
 * 
 * @param {String} name - the name of the provider
 * @param {String} owner_id - the owner_id of the provider
 * @param {String} contact_no - the contact_no of the provider
 * @param {String} category - the category of the provider
 * @param {String} sub_category - the sub_category of the provider
 * @param {String} queue_capacity - the queue_capacity of the provider
 * @param {String} current_queue - the current_queue of the provider
 * @param {String} location - the location of the provider
 * @param {String} password - the password of the provider
 * 
 * @return {Promise} - promise that will be resolved (or rejected)
 * when the call to the DB completes
 */
function create(name, owner_id, contact_no, category, sub_category, queue_capacity, current_queue, location, password) {
    return new Promise((resolve, reject) => {
        let itemId = uuidv4();
        let whenCreated = Date.now();
        let item = {
            _id: itemId,
            id: itemId,
            whenCreated: whenCreated,
            name: name,
            owner_id: owner_id,
            contact_no: contact_no,
            category: category,
            sub_category: sub_category,
            queue_capacity: queue_capacity,
            current_queue: current_queue,
            location: location,
            password: password,
        };
        db.insert(item, (err, result) => {
            if (err) {
                console.log('Error occurred: ' + err.message, 'create()');
                reject(err);
            } else {
                resolve({ data: { createdId: result.owner_id, createdRevId: result.rev }, statusCode: 201 });
            }
        });
    });
}

/**
 * Update a resource with the requested new attribute values
 * 
 * @param {String} id - the ID of the item (required)
 * 
 * The following parameters can be null
 * 
 * @param {String} name - the name of the provider
 * @param {String} owner_id - the owner_id of the provider
 * @param {String} contact_no - the contact_no of the provider
 * @param {String} category - the category of the provider 
 * @param {String} sub_category -the sub_category of the provider
 * @param {String} queue_capacity - the queue_capacity of the provider 
 * @param {String} current_queue - the current_queue of the provider
 * @param {String} location - the location of the provider
 * @param {String} password - the password of the provider
 * 
 * @return {Promise} - promise that will be resolved (or rejected)
 * when the call to the DB completes
 */
function update(id, name, owner_id, contact_no, category, sub_category, queue_capacity, current_queue, location, password) {
    return new Promise((resolve, reject) => {
        db.get(id, (err, document) => {
            if (err) {
                resolve({statusCode: err.statusCode});
            } else {
                let item = {
                    _id: document._id,
                    _rev: document._rev,            // Specifiying the _rev turns this into an update
                }
                
                if (name) {item["name"] = name} else {item["name"] = document.name};
                if (owner_id) {item["owner_id"] = owner_id} else {item["owner_id"] = document.owner_id};
                if (contact_no) {item["contact_no"] = contact_no} else {item["contact_no"] = document.contact_no};
                if (category) {item["category"] = category} else {item["category"] = document.category};
                if (sub_category) {item["sub_category"] = sub_category} else {item["sub_category"] = document.sub_category};
                if (queue_capacity) {item["queue_capacity"] = queue_capacity} else {item["queue_capacity"] = document.queue_capacity};
                if (current_queue) {item["current_queue"] = current_queue} else {item["current_queue"] = document.current_queue};
                if (location) {item["location"] = location} else {item["location"] = document.location};
                if (password) {item["password"] = password} else {item["password"] = document.password};
                
 
                db.insert(item, (err, result) => {
                    if (err) {
                        console.log('Error occurred: ' + err.message, 'create()');
                        reject(err);
                    } else {
                        resolve({ data: { updatedRevId: result.rev }, statusCode: 200 });
                    }
                });
            }            
        })
    });
}

function info() {
    return cloudant.db.get(db_name)
        .then(res => {
            console.log(res);
            return res;
        });
};

module.exports = {
    deleteById: deleteById,
    create: create,
    update: update,
    find: find,
    info: info
  };