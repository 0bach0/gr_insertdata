var kue = require("kue");                                                    
var jobs = kue.createQueue(
        {redis:{
            host: 'kue'
        }}
    ); 


var thrift = require("thrift");
var Insert = require("./gen-nodejs/insertData");
var ttypes = require("./gen-nodejs/insert_types");

var neo4j = require('node-neo4j');
var db = new neo4j('http://neo4j:root@dockerneo4j:7474');

function createNodeJob(query,type){
    var job = jobs.create('insertnode',{
     	title:'create node',
     	query:query,
     	type:type
    });
    
    job.on('complete', function(result){
      console.log('Job completed with data ', result);
    
    }).on('failed attempt', function(errorMessage, doneAttempts){
      console.log('Job failed',errorMessage,doneAttempts);
    
    }).on('failed', function(errorMessage){
      console.log('Job failed',errorMessage);
    
    }).on('progress', function(progress, data){
      console.log('done' );
    
    }).attempts(3);
    job.save();
}
function createRelationshipJob(query){
    var job = jobs.create('insertrelationship',{
     	title:'create relationship',
     	query:query
    });
    
    job.on('complete', function(result){
      console.log('Job completed with data ', result);
    
    }).on('failed attempt', function(errorMessage, doneAttempts){
      console.log('Job failed',errorMessage,doneAttempts);
    
    }).on('failed', function(errorMessage){
      console.log('Job failed',errorMessage);
    
    }).on('progress', function(progress, data){
      console.log('done' );
    
    }).attempts(3);
    job.save();
}

var server = thrift.createServer(Insert, {
  
  createNode: function(str,postType, result) {
    try{
      str = JSON.parse(str);
      console.log("Addnode",str);
      var arr = ['node',postType];
      
      if(str.hasOwnProperty('created_time')){
        var myDate = new Date(str.created_time);
        var postTime = myDate.getTime() / 1000;
        str.created_time = postTime;  
      }
      
      for(var attributename in str)
        if (typeof(str[attributename])!='string')
          {
            str[attributename] = JSON.stringify(str[attributename]);
            console.log(str[attributename]);
          }
          
      createNodeJob(str,arr);    
      // db.insertNode(str, arr, function (err, result) {
      //   if (err) {console.log(err)};
      // });
      
      result(null);
    }
    catch(err){
      console.log("ERROR createNode",err);
    }
  },
  checkNode: function(str, result) {
    try{
      console.log("Checknode",str);
      str = JSON.stringify(str);
      var query = "MATCH (n:node {id: " + str + "}) RETURN n";
      
      console.log('checkNode query',query);
      
      var stream = db.cypherQuery(query, function(err, results){
        if (err) {console.log(err)};
        console.log('searchNode here',results);
        
        try{
          results = results.data;
          
          if (results.length == 0) {
              result(null,-1);
          } else {
            result(null,results[0]._id);
          }
        }
        catch(err)
        {
          result(null,-1);          
        }
      });
    }
    catch(err){
      console.log("ERROR createREACTION",err);
    }
  },
  createCommentRelationship: function(fromUser,toUser,through,result){
    toUser = JSON.stringify(toUser);
    through = JSON.stringify(through);
    
    var query = "MATCH (u:node {id:"+ fromUser +"}), (r:comment {id:"+ through+"}), (v:node {id:"+ toUser+"}) CREATE (u)-[:comment_from]->(r) CREATE (r)-[:comment_to]->(v)";
    console.log(query);
    createRelationshipJob(query);
    
    // db.cypherQuery(query,function(err, results) {
    //   if(err){console.log(err)};
    // })
  },
  checkReaction: function(fromUser,node,result){
    try {
      console.log('checkreaction input',fromUser,node);
      fromUser = '"'+JSON.parse(fromUser)+'"';
      node = '"'+node+'"';
      
      var query = "MATCH (u:node{id:"+fromUser+"}) -[r:reaction]->  (v:node{id:"+node+"}) return r";
      var stream = db.cypherQuery(query, function(err, results){
        if (err) {console.log(err)};
        
        try{
          results = results.data;
          var res = results[0];
          if (!res) {
              result(null,"-1");
          } else {
            result(null,res.type);
          }
        }
        catch(err){
          result(null,"-1");
        }
      });
        
    }
    catch(err) {
        console.log("ERROR checkREACTION",err);
    }
    
  },
  createReaction: function(fromUser,node,type,result){
    try{
      fromUser = JSON.parse(fromUser);
      
      var query = "MATCH (u:node{id:'"+fromUser+"'}), (v:node{id:'"+node+"'}) CREATE UNIQUE (u)-[:reaction{type:'" + type + "'}]->(v)";
      console.log("create",query);
      // var stream = db.cypherQuery(query, function(err, results){
      //   if (err) {console.log(err)};
      // });
      createRelationshipJob(query);
    }
    catch(err) {
        console.log("ERROR createREACTION",err);
    }
  }
  
        
});

server.listen(9090);


    