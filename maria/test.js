var sworm = require('sworm');

var database = require("./demo.json");
var model = "user";
var payload = {
        data:{
           
	}
    };

//console.dir(database);
sworm.db(database)
     .then(function (db) {
           db.query("desc "+model,[])
             .then(function(schema){ 
		       var IDs = [];
	               for(var n=0;n<schema.length;n++){
			 if(schema[n].Key == 'PRI')
		           IDs.push(schema[n].Field);
		       }
		       console.dir(IDs);
	           },
                   function(errors){ console.warn(errors); })
             .finally(function(){ db.close() });
      });	 

