var async = require('async');

async.series([

    // 1st

    function(callback){

        callback(null, 1);

    },

    // 2nd

    function(callback){

        callback(null, 2);
        
    }

], 

// callback (final)

function(err, results){

    console.log(err); // null

    console.log(results); // [1, 2]

});

/*
async.waterfall([

    // func1
    function(callback){
        
        // '111', 'one'이란 문자열을 인자로 다음함수 func2(callback) 호출

        callback(null, '111', 'one');

    },

    // func2 (args 2개 지정)

    function(arg1, arg2, callback){

        console.log('func2 args = '+arg1+', '+arg2);

        // '222'란 문자열을 인자로 다음함수 func3(callback) 호출

        callback(null, '222');

    },

    // func3

    function(arg, callback){

        console.log('func3 args = '+arg);

        // 'three'란 문자열을 인자로 final callback 호출

        callback(null, 'three');

    }

], 

// callback (final)

function(err, result){

    console.log(result); // results가 아니고 result임

});
*/


