require('dotenv').config({ silent: true })

const express = require('express');
const bodyParser = require('body-parser');

const assistant = require('./lib/assistant.js');
const port = process.env.PORT || 3000

const cloudant = require('./lib/cloudant.js');

var multer = require('multer');
var fs = require('fs');
var FormData = require('form-data');
var axios = require('axios');

const geolib = require('geolib');

const app = express();
app.use(bodyParser.json());

const testConnections = () => {
  const status = {}
  return assistant.session()
    .then(sessionid => {
      status['assistant'] = 'ok';
      return status
    })
    .catch(err => {
      console.error(err);
      status['assistant'] = 'failed';
      return status
    })
    .then(status => {
      return cloudant.info();
    })
    .then(info => {
      status['cloudant'] = 'ok';
      return status
    })
    .catch(err => {
      console.error(err);
      status['cloudant'] = 'failed';
      return status
    });
};

const handleError = (res, err) => {
  const status = err.code !== undefined && err.code > 0 ? err.code : 500;
  return res.status(status).json(err);
};

app.get('/', (req, res) => {
  testConnections().then(status => res.json({ status: status }));
});

/**
 * Get a session ID
 *
 * Returns a session ID that can be used in subsequent message API calls.
 */
app.get('/api/session', (req, res) => {
  assistant
    .session()
    .then(sessionid => res.send(sessionid))
    .catch(err => handleError(res, err));
});

/**
 * Post process the response from Watson Assistant
 *
 * We want to see if this was a request for resources/supplies, and if so
 * look up in the Cloudant DB whether any of the requested resources are
 * available. If so, we insert a list of the resouces found into the response
 * that will sent back to the client.
 * 
 * We also modify the text response to match the above.
 */
function post_process_assistant(result) {
  let resource
  // First we look to see if a) Watson did identify an intent (as opposed to not
  // understanding it at all), and if it did, then b) see if it matched a supplies entity
  // with reasonable confidence. "supplies" is the term our trained Watson skill uses
  // to identify the target of a question about resources, i.e.:
  //
  // "Where can i find face-masks?"
  //
  // ....should return with an enitity == "supplies" and entitty.value = "face-masks"
  //
  // That's our trigger to do a lookup - using the entitty.value as the name of resource
  // to to a datbase lookup.
  if (result.intents.length > 0) {
    result.entities.forEach(item => {
      if ((item.entity == "supplies") && (item.confidence > 0.25)) {
        resource = item.value
      }
    })
  }
  if (!resource) {
    return Promise.resolve(result)
  } else {
    // OK, we have a resource...let's look this up in the DB and see if anyone has any.
    return cloudant
      .find(resource, '', '', '')
      .then(data => {
        let processed_result = result
        if ((data.statusCode == 200) && (data.data != "[]")) {
          processed_result["resources"] = JSON.parse(data.data)
          processed_result["generic"][0]["text"] = 'There is' + '\xa0' + resource + " available"
        } else {
          processed_result["generic"][0]["text"] = "Sorry, no" + '\xa0' + resource + " available"
        }
        return processed_result
      })
  }
}

/**
 * Post a messge to Watson Assistant
 *
 * The body must contain:
 * 
 * - Message text
 * - sessionID (previsoulsy obtained by called /api/session)
 */
app.post('/api/message', (req, res) => {
  const text = req.body.text || '';
  const sessionid = req.body.sessionid;
  console.log(req.body)
  assistant
    .message(text, sessionid)
    .then(result => {
      return post_process_assistant(result)
    })
    .then(new_result => {
      res.json(new_result)
    })
    .catch(err => handleError(res, err));
});

/**
 * Get a list of resources
 *
 * The query string may contain the following qualifiers:
 * 
 * - type
 * - name
 * - userID
 *
 * A list of resource objects will be returned (which can be an empty list)
 */
app.get('/api/resource', (req, res) => {
  const category = req.query.category;
  const sub_category = req.query.sub_category;
  const name = req.query.name;
  const owner_id = req.query.owner_id;

  cloudant
    .find(category, sub_category, name, owner_id)
    .then(data => {
      if (data.statusCode != 200) {
        res.sendStatus(data.statusCode)
      } else {
        res.send(data.data)
      }
    })
    .catch(err => handleError(res, err));
});

/**
 * Create a new resource
 *
 * The body must contain:
 * 
 * - type
 * - name
 * - contact
 * - userID
 *
 * The body may also contain:
 * 
 * - description
 * - quantity (which will default to 1 if not included)
 * 
 * The ID and rev of the resource will be returned if successful
 */
let types = ["Food", "Other", "Help"]
app.post('/api/resource', (req, res) => {

  // Validation
  // ------
  if (!req.body.name) {
    return res.status(422).json({ errors: "Name of provider must be provided" });
  }
  if (!req.body.owner_id) {
    return res.status(422).json({ errors: "Owner of provider must be provided" });
  }
  if (!req.body.contact_no) {
    return res.status(422).json({ errors: "Contact Number of provider must be provided" });
  }
  if (!req.body.category) {
    return res.status(422).json({ errors: "Category of provider must be provided" });
  }
  if (!req.body.sub_category) {
    return res.status(422).json({ errors: "Sub Category of provider must be provided" });
  }
  if (!req.body.serving_capacity) {
    return res.status(422).json({ errors: "Queue Capacity of provider must be provided" });
  }
  if (!req.body.location) {
    return res.status(422).json({ errors: "Location of provider must be provided" });
  }
  if (!req.body.password) {
    return res.status(422).json({ errors: "Password of provider must be provided" });
  }
  // ------

  // Provider details
  // -----
  const name = req.body.name;
  const owner_id = req.body.owner_id;
  const contact_no = req.body.contact_no;
  const category = req.body.category;
  const sub_category = req.body.sub_category;
  const serving_capacity = req.body.serving_capacity
  const in_queue = 0;
  const in_store = 1;
  const marker = 'markerGreen'
  const location = req.body.location;

  //base64 encoding
  const buff = new Buffer(req.body.password);
  const password = buff.toString('base64');
  // -----

  cloudant
    .create(name, owner_id, contact_no, category, sub_category, serving_capacity, in_queue, in_store, marker, location, password)
    .then(data => {
      if (data.statusCode != 201) {
        res.sendStatus(data.statusCode)
      } else {
        res.send(data.data)
      }
    })
    .catch(err => handleError(res, err));
});

/**
 * Update new resource
 *
 * The body may contain any of the valid attributes, with their new values. Attributes
 * not included will be left unmodified.
 * 
 * The new rev of the resource will be returned if successful
 */

app.patch('/api/resource/:id', (req, res) => {

  // Provider details
  // -----
  const name = req.body.name || '';
  const owner_id = '';
  const contact_no = req.body.contact_no || '';
  const category = '';
  const sub_category = '';
  const serving_capacity = req.body.serving_capacity || '';
  const in_queue = '';
  const in_store = '';
  const marker = 'markerGreen';
  const location = req.body.location || '';
  var password = '';
  if (req.body.password) {
    //base64 encoding
    const buff = new Buffer(req.body.password);
    password = buff.toString('base64');
  }
  // -----

  cloudant
    .update(req.params.id, name, owner_id, contact_no, category, sub_category, serving_capacity, in_queue, in_store, marker, location, password)
    .then(data => {
      if (data.statusCode != 200) {
        res.sendStatus(data.statusCode)
      } else {
        res.send(data.data)
      }
    })
    .catch(err => handleError(res, err));
});

/**
 * Delete a resource
 */
app.delete('/api/resource/:id', (req, res) => {
  cloudant
    .deleteById(req.params.id)
    .then(statusCode => res.sendStatus(statusCode))
    .catch(err => handleError(res, err));
});

/**
 * Delete a resource
 */
app.post('/api/resource/login', (req, res) => {
  if (!req.body.owner_id) {
    return res.status(422).json({ errors: "owner_id of provider must be provided" });
  }
  if (!req.body.password) {
    return res.status(422).json({ errors: "password of provider must be provided" });
  }

  cloudant
    .find(undefined, undefined, undefined, req.body.owner_id)
    .then(data => {
      if (data.statusCode != 200) {
        res.sendStatus(data.statusCode)
      } else {
        var providers = JSON.parse(data.data);
        if (providers.length > 0) {
          let buff = new Buffer(providers[0].password, 'base64');
          let password = buff.toString('ascii');

          res.send(password === req.body.password);
        } else {
          return res.status(422).json({ errors: "owner_id not present" });
        }
      }
    })
    .catch(err => handleError(res, err));
});

app.post('/api/resource/checkin', (req, res) => {
  if (!req.body.id) {
    return res.status(422).json({ errors: "id of provider must be provided" });
  }
  if (!req.body.token) {
    return res.status(422).json({ errors: "token of provider must be provided" });
  }

  cloudant
    .update(req.body.id, '', '', '', '', '', '', '', '', '', '', '', true)
    .then(data => {
      if (data.statusCode != 200) {
        res.sendStatus(data.statusCode)
      } else {
        res.send(data.data)
      }
    })
    .catch(err => handleError(res, err));
});

app.post('/api/resource/checkout', (req, res) => {
  if (!req.body.id) {
    return res.status(422).json({ errors: "id of provider must be provided" });
  }
  if (!req.body.token) {
    return res.status(422).json({ errors: "token of provider must be provided" });
  }

  cloudant
    .update(req.body.id, '', '', '', '', '', '', '', '', '', '', '', false)
    .then(data => {
      if (data.statusCode != 200) {
        res.sendStatus(data.statusCode)
      } else {
        res.send(data.data)
      }
    })
    .catch(err => handleError(res, err));
});

var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    var dir = './uploads';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    callback(null, dir);
  },
  filename: function (req, file, callback) {
    let fileN = Date.now() + '.' + file.originalname;
    callback(null, fileN);
  }
});

var upload = multer({ storage: storage });
var type = upload.single('image_file');

app.post('/getHeadCount', type, function (req, res) {
  let file = {
    localPath: './uploads/' + req.file.filename,
    name: req.file.filename,
    threshold: process.env.THRESHOLD,
    id: req.body.id
  };

  var data = new FormData();
  data.append('images_file', fs.createReadStream(file.localPath));
  data.append('collection_ids', '59e65168-d7a6-4c39-9613-523a07d45412');
  data.append('features', 'objects');
  data.append('threshold', file.threshold);

  var URL = process.env.IMAGE_ANALYZE_URL;
  var token = 'Basic ' + Buffer.from('apikey' + ':' + process.env.IMAGE_ANALYZE_API_KEY).toString('base64');

  axios.post(URL, data, {
    headers: {
      'accept': 'application/json',
      'Accept-Language': 'en-US,en;q=0.8',
      'Content-Type': `multipart/form-data; boundary=${data._boundary}`,
      'Authorization': token,
    }
  })
    .then((response) => {
      console.log(JSON.stringify(response.data));
      let headCounts = response.data.images[0].objects.collections[0].objects.length;

      cloudant
        .updateInQueue(file.id, headCounts)
        .then(data => {
          if (data.statusCode != 200) {
            res.sendStatus(data.statusCode);
          } else {
            let message = {
              id: file.id,
              head_counts: headCounts,
              shop_name: data.data.name
            }
            return res.send(message);
          }
        })
        .catch(err => handleError(res, err));
    }).catch((error) => {
      console.error(error);
      handleError(res, err);
    });
});

var isInCorridor = (geo_corridor, geo_point) => {
  return geolib.isPointWithinRadius({
    latitude: geo_corridor.latitude,
    longitude: geo_corridor.longitude
  }, {
    latitude: geo_point.latitude,
    longitude: geo_point.longitude
  },
    geo_corridor.radius);
};

app.post('/enforcePolicy', type, function (req, res) {
  //Policy
  let policy = {
    "policy_name": req.body.policy_name,
    "policy_rule": {
      "capacity": req.body.policy_rule.capacity
    },
    "zone": {
      "latitude": req.body.zone.latitude,
      "longitude": req.body.zone.longitude,
      "radius": req.body.zone.radius
    }
  };

  //Geo Corridor
  let geo_corridor = {
    latitude: policy.zone.latitude,
    longitude: policy.zone.longitude,
    radius: policy.zone.radius
  };

  let shopsAffected = [];

  cloudant
    .find('', '', '', '')
    .then(data => {
      if (data.statusCode != 200) {
        res.sendStatus(data.statusCode)
      } else {
        let vendors = JSON.parse(data.data);
        var promises = [];

        for (let index = 0; index < vendors.length; index++) {
          let coordinates = vendors[index].location.split(',');

          let geo_point = {
            latitude: coordinates[0],
            longitude: coordinates[1]
          };

          if (isInCorridor(geo_corridor, geo_point)) {
            let capacity = Math.floor(vendors[index].serving_capacity * policy.policy_rule.capacity);

            promises.push(cloudant.updateServingCapacityAndPolicy(vendors[index]._id, policy, capacity));
            shopsAffected.push(vendors[index].name);
          }
        }

        Promise.all(promises)
          .then(() => {
            return res.send({ shops_affected: shopsAffected, count: shopsAffected.length });
          })
          .catch((e) => {
            return handleError(res, err);
          });
      }
    })
    .catch(err => handleError(res, err));
});

const server = app.listen(port, () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log(`SolutionStarterKitCooperationServer listening at http://${host}:${port}`);
});
