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
function find(category, sub_category, name, owner_id) {
    return new Promise((resolve, reject) => {
        let selector = {}
        if (category) {
            selector['category'] = category;
        }
        if (name) {
            let search = `(?i).*${name}.*`;
            selector['name'] = {'$regex': search};

        }
        if (sub_category) {
            selector['sub_category'] = sub_category;
        }
        if (owner_id) {
            selector['owner_id'] = owner_id;
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
 * @param {String} serving_capacity - the serving_capacity of the provider
 * @param {String} in_queue - the in_queue queue of the provider
 * @param {String} in_store - the in_store queue of the provider
 * @param {String} marker - the marker of the queue of the provider
 * @param {String} location - the location of the provider
 * @param {String} password - the password of the provider
 * 
 * @return {Promise} - promise that will be resolved (or rejected)
 * when the call to the DB completes
 */
function create(name, owner_id, contact_no, category, sub_category, serving_capacity, in_queue, in_store, marker, location, password) {
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
            serving_capacity: serving_capacity,
            in_queue: in_queue,
            in_store: in_store,
            marker: marker,
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
 * @param {String} serving_capacity - the serving_capacity of the provider 
 * @param {String} in_queue - the in_queue queue of the provider
 * @param {String} in_store - the in_store queue of the provider
 * @param {String} marker - the marker of the queue of the provider
 * @param {String} location - the location of the provider
 * @param {String} password - the password of the provider
 * 
 * @return {Promise} - promise that will be resolved (or rejected)
 * when the call to the DB completes
 */
function update(id, name, owner_id, contact_no, category, sub_category, serving_capacity, in_queue, in_store, marker, location, password, isIncrement) {
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
                if (serving_capacity) {item["serving_capacity"] = serving_capacity} else {item["serving_capacity"] = document.serving_capacity};
                if (in_queue) {item["in_queue"] = in_queue} else {item["in_queue"] = document.in_queue};
                
                if (in_store) {
                    item["in_store"] = in_store
                } else {
                    item["in_store"] = (isIncrement) ? document.in_store + 1 : document.in_store - 1 
                };
                
                if (marker) {item["marker"] = marker} else {item["marker"] = document.marker};
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

function updateInQueue(id, in_queue) {
    return new Promise((resolve, reject) => {
        db.get(id, (err, document) => {
            if (err) {
                resolve({statusCode: err.statusCode});
            } else {
                let item = {
                    _id: document._id,
                    _rev: document._rev,            // Specifiying the _rev turns this into an update
                }
                
                item["name"] = document.name;
                item["owner_id"] = document.owner_id;
                item["contact_no"] = document.contact_no;
                item["category"] = document.category;
                item["sub_category"] = document.sub_category;
                item["serving_capacity"] = document.serving_capacity;
                item["in_queue"] = in_queue;
                item["in_store"] = document.in_store; 
                item["marker"] = document.marker;
                item["location"] = document.location;
                item["password"] = document.password;
                
 
                db.insert(item, (err, result) => {
                    if (err) {
                        console.log('Error occurred: ' + err.message, 'create()');
                        reject(err);
                    } else {
                        resolve({ data: { updatedRevId: result.rev, name: document.name }, statusCode: 200 });
                    }
                });
            }            
        })
    });
};

function updateServingCapacityAndPolicy(id, enforce_policy, serving_capacity) {
    console.log(id);
    return new Promise((resolve, reject) => {
        db.get(id, (err, document) => {
            if (err) {
                console.log(err);
                reject(err);
            } else {
                let item = {
                    _id: document._id,
                    _rev: document._rev,            // Specifiying the _rev turns this into an update
                }
                
                item["name"] = document.name;
                item["owner_id"] = document.owner_id;
                item["contact_no"] = document.contact_no;
                item["category"] = document.category;
                item["sub_category"] = document.sub_category;
                item["serving_capacity"] = serving_capacity;
                item["in_queue"] = document.in_queue;
                item["in_store"] = document.in_store; 
                item["marker"] = document.marker;
                item["location"] = document.location;
                item["password"] = document.password;
                item["zone"] = "RED";
                
                if (enforce_policy) {
                    item["enforced_policy"] = enforce_policy;
                }
                
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
};

module.exports = {
    deleteById: deleteById,
    create: create,
    update: update,
    find: find,
    info: info,
    updateInQueue: updateInQueue,
    updateServingCapacityAndPolicy: updateServingCapacityAndPolicy
  };