var kue = require("kue");                                                    
var jobs = kue.createQueue(
        {redis:{
            host: 'kue'
        }}
    ); 
    
var neo4j = require('node-neo4j');
var db = new neo4j('http://neo4j:root@dockerneo4j:7474');


jobs.process('insertnode', function (job, done){
    console.log(job.data.query);
    
    var str = job.data.query;
    var arr = job.data.type;
    
    try
    {
        db.insertNode(str, arr, function (err, result) {
             if (err) {console.log(err);done();}
             else{done();};
          });
    }
    catch(err)
    {
        console.log(err);
        done();
    }
});