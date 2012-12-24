/************************************************************
 * File: secretary.js
 * Author: Devon Olivier
 * Year: 2012
 * Purpose: Manages asynchronous function calls. Gives us
 *          the ability to put jobs "on the secretary's table"
 *          and be notified when all the jobs are finished
 * Platform: node.js
 ***********************************************************/
var events = require('events');

exports.createSecretary = function createSecretary(){
  var secretary = Object.create(new events.EventEmitter());
  var jobCount = 0;

  /************************************************************
   * doJob takes an asynchronous function and calls it providing
   * a callback.
   * The net effect is as though callback was given to to job
   * ie. the semantics is doJob(job, callback) is equivalent to
   * job(callback)
   ***********************************************************/
  secretary.doJob = function(job, callback){
    //TODO consider conceptualising this as an 'asynchronous
    //function set' with methods like var myFuncId = agent.addFunction(myFunc),
    //agent.isFinished(<id given when function was added>)
    var self = this;
    job(function(){
      jobCount--;
      callback.apply(null, arguments);
      if(jobCount === 0){
        //IMPORTANT NOT TO USE agent.emit since self is not equal to agent 
        //Research this!
        //console.log('[agent] SELF===AGENT: ', self === agent);
        self.emit('no more jobs');
      }
    });
    jobCount++;
  };

  secretary.hasMoreJobs = function(){
    return jobCount > 0;
  };
  return secretary;
};

