/**
 * Created by psh on 2016/6/5.
 */
var co=require("co");
//function* a() { yield console.log("1"); yield console.log("2"); yield console.log("3");return 10; }
//function* b() { yield console.log("4"); yield* a(); yield console.log("5"); return 20; }
//function* c() { yield console.log("6"); yield* b();  yield console.log("7"); }

//for (var x of c()) console.log(x)
//for (var x of c());
//co(c);

// wrap the function to thunk
function readFile(filename) {
    return function(callback) {
        require('fs').readFile(filename, 'utf8', callback);
    };
}
/*
co(function * () {
    var file1 = yield readFile('./file/a.txt');
    var file2 = yield readFile('./file/c.txt');

    console.log(file1);
    console.log(file2);
    return 'done';
}).catch(function(err) {
    console.log(err)
});
*/
/*
var promise = new Promise(function(resolve, reject) {
    console.log('ok');
resolve(123);

});

promise.then(function(value){
    console.log('ok');
    resolve(2) ;
}).then(function(value){
    console.log('ok');

}).catch(function(err){
    console.log(err);
});
*/

function a(){
    return co(function* (){
        console.log("start");

        return {id:1};
    }).catch(function(err){
        return err;
        //console.log(err);
    });
}

function b(){
    a().then(function(value){
        console.log("this is return");
        console.log(value);
    })

}

b();