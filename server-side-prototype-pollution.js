const user =  {
    username: "wiener",
    userId: 1234,
    isAdmin: false
}

console.log(user);
console.log(user.username);
console.log(user['userId']);
console.log(user.username.__proto__);
console.log(user['username'].__proto__.__proto__);


let myObject = {};
obJProto = Object.getPrototypeOf(myObject);    // Object.prototype

let myString = "myString";
stringProto = Object.getPrototypeOf(myString);    // String.prototype

let myArray = [];
arrayProto = Object.getPrototypeOf(myArray);	    // Array.prototype

let myNumber = 1;
numProto = Object.getPrototypeOf(myNumber);    // Number.prototype

console.log(obJProto, stringProto, arrayProto, numProto)

String.prototype.removeWhitespace = function () {
    let result = '';
    for (let i = 0; i < this.length; i++) {
      if (this[i] !== ' ' && this[i] !== '\t' && this[i] !== '\n' && this[i] !== '\r') {
        result += this[i];
      }
    }
    return result;
  }

let withWhitespace = " i gots spaces    ";
let noWhitespace = withWhitespace.removeWhitespace();
console.log(noWhitespace)

const objectLiteral = {__proto__: {evilProperty: 'payload'}};
const objectFromJson = JSON.parse('{"__proto__": {"evilProperty": "payload"}}');

console.log(objectLiteral.hasOwnProperty('__proto__'));     // false
console.log(objectFromJson.hasOwnProperty('__proto__'));    // true

String.prototype.customProp = "foobar";

myCustomStr = "barbaz";

console.log(myCustomStr.customProp);

// DETECTION/PREVENTION

const myEnumerableObject = { a: 1, b: 2 };

// Apply a freeze
//Object.freeze(Object.prototype)

//Apply a seal - property does not exist so property is not set
//Object.seal(Object.prototype)

// pollute the prototype with an arbitrary property
Object.prototype.foo = 'bar';

//Apply a seal - property exist so changes are allowed
Object.seal(Object.prototype)

Object.prototype.foo = 'baz';

// confirm myObject doesn't have its own foo property
myEnumerableObject.hasOwnProperty('foo'); // false

// list names of properties of myObject
for(const propertyKey in myEnumerableObject){
    console.log(propertyKey);
}

console.log(myEnumerableObject.foo)

const myEnumerableArray = ['a','b'];
Object.prototype.foo = 'bar';

for(const arrayKey in myEnumerableArray){
    console.log(arrayKey);
}
