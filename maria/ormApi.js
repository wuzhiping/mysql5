var nools = require("nools");
var uuid = require('node-uuid');
var url = require('url');
var querystring = require('querystring');

exports.startRules=function(req,res){

    var app = req.params.app,
        model = req.params.model,
        resource = req.params.resource,
        db = require("./"+req.params.db+".json"),
        payload = req.body,
        method = req.method,
        flowName = uuid.v4(),
        outBound = {};


    var flow = nools.compile(__dirname + "/orm.nools"
            ,{
                name:flowName,
                scope:{
                    outBound:outBound,
                    logger:console.log
                }
            }),
        Message = flow.getDefined("Inbound");

    var session = flow.getSession();
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress,
        uri = req.url,
        query = querystring.parse(url.parse(req.url).query);

    //
    if(!payload.from)
        payload.from = ip;

    //
    var message =  new Message({
            ip:ip,
            uri:uri,
            query:query,
            session:req.session,
            headers:req.headers,
            files:req.files,
            method:req.method,
            model:req.params.model,
            db:db
        },
        payload);
    var result = {};
    result.Inbound = message;
    //result.Outbound={};
    result.logs = [];

    session.on("fire", function(name, rule){
        result.logs.push({stamp:Date.now(),name:name,data:rule});
    });

    session.on("assert", function(fact){
        result.logs.push({stamp:Date.now(),name:"assert",data:fact});
    });

    session.on("retract", function(fact){
        result.logs.push({stamp:Date.now(),name:"retract",data:fact});
    });

    session.on("modify", function(fact){
        result.logs.push({stamp:Date.now(),name:"modify",data:fact});
    });
    //session.on('SUCCESS',function(data){
    //    result.Outbound = data;
    //});
    session.assert(message);

    session.match(function(err){
        //logger.info("match:");
        //logger.info(result);
        //console.dir(result);
        if(err){
            result.ERROR = err;
            console.log(err);
            res.send(500,err);
        } else if (outBound.err){
            result.ERROR = outBound.err;
            console.log(outBound.err);
            res.send(500,outBound.err);

        } else if(outBound.redirect){
            res.redirect(outBound.redirect.url);
        } else {
            res.json(outBound.result);
        }
        //
        if(outBound.DEBUG){
            console.dir(result);
        }

        session.dispose();
        nools.deleteFlow(flowName);

    });
};


