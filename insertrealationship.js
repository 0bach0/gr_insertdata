var kue = require("kue");                                                    
var jobs = kue.createQueue(
        {redis:{
            host: 'kue'
        }}
    ); 
    
var neo4j = require('node-neo4j');
var db = new neo4j('http://neo4j:root@dockerneo4j:7474');


jobs.process('insertrelationship', function (job, done){
    console.log(job.data.query);
    
    var str = job.data.query;
    
    try
    {
        db.cypherQuery(str,function(err, results) {
          if (err) {console.log(err); done();}
             else{
                 setTimeout(function(){done();},500);
             };
        })
        
    }
    catch(err)
    {
        console.log(err);
        done();
    }
});