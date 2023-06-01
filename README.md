# What is http-jsonmock-server?

Runs a web server for simple mocking that responds to JSON data.
It requires only one javascript file.

It can be used in the following ways

 - Server for testing Web API response (normal / abnormal)

Sample data is included in the project, so please try it first.

````
npm run start
````

This will start the mock server, and if you access http://localhost:9876/test1/ with a browser, you will see the contents of the JSON data,
The contents of the JSON data will be displayed.
This is the same as ". /mockdata/test1.json" in the project.

# Assumptions

To use this service, node.js must be available.
We have confirmed that it works with the following.
 Older versions will also work.

- node.js v19.9.0
- Ubuntu 20.04 LTS

# How to use

Start npm command directly under the project.

```
> npm run start
```

Or you can call javscript directly from node.

```
> node src
```

# Project structure

The structure of the project is simple as follows.
By creating static data in mockdata that you want to respond to as a WebAPI response,
Mock response is possible by creating static data in mockdata.

You can change the read destination of the mock data to a given relative/absolute path by adding `-docpath` to the startup options.

```
Project
 |
 |- src
 |   |
 |   +-index.js   ... Main Program
 |
 +- mockdata  ... mock data files under this directory
```



For example, switching docpath can be used to simulate multiple versions of a web service or
For example, docpath switching can be used to simulate multiple versions of a web service or API to be mocked.

Example of docpath switching:

```
> npm run start -- --docpath=appAAA-v1
> npm run start -- --docpath=appBBB-v1
```

# Create data for normal system mock

Mock data in json format that the server responds to is created in `mockdata` by default.

As an example of normal response data,

If you are accessing `http://localhost:9876/samplewebapp/v1/userdata/123456/`,
In the project `. /mockdata/samplewebapp/v1/userdata/123456.json` in the project and respond with response code 200 and file contents as response data.

Specifically, if there is a "/" at the end of the URL PATH, trim it and refer to the file path with the extension ".json".

If the target mock file exists, confirm that the mock file contents are in JSON format, and then
If the mock file exists, a response code indicating that the response is a normal response of 200 and a response header* in the "JSON" data format for the mock file contents are added to the response.

Set "application/json" to the "Content-Type" of the response header.

Example of mock data for normal system response:

```
{
    "no": 12345,
    "price" : 500,
    "name" : "1234567890ABCDEFAIEO"
}
````

# Create data for anomaly system mock

As an example of anomaly response data,

By accessing `http://localhost:9876/samplewebapp/v1/userdata/notfound/`.
Path in the project `. /mockdata/samplewebapp/v1/userdata/notfound.err.json` in the project and responds as response code and response data.

In this case, even if there is a file `/mockdata/samplewebapp/v1/userdata/notfound.json` in the normal system
(priority is given to the abnormal system). (Abnormal system is given priority.)

Mock files for abnormal systems are described in the following structure.

```
{
    "code": 500,
    "contents" : {
        "errorcode" : "TESTERR500-0010",
        "message" : "500 TestError by Mockdata!"
    }
}
```

- The key value `code` is the server response code that is assumed to be an error system.
- The key value `contents` describes the contents to be set in the response body as an error system.

# error in server

The error response of http-jsonmock-server itself has the following patterns.


| response code | error content | reason why error occurred |
| --- | --- | --- |
| 500 | Json file parse error. File=[{filepath}] | Failed to parse mock data contents in JSON format. |
| 404 | File Not Found. File=[{filePath}] | Corresponding mock data file did not exist. |


# Startup Options

The startup options for http-jsonmock-server can be specified in Key-Value format from the arguments as follows.

Example of starting via npm run start:

```
npm run start -- -port=1234 -docpath=./mockdatav2 -loglevel=INFO
```

Example for launching directly via node.js: 

```
node src -port=1234 -docpath=./mockdatav2 -loglevel=INFO
```

| options | default values | summary |
| --- | --- | --- |
| -port | 9876 | port used by mock server |
| -docpath | ./mockdata | The path to the mock data. Specify either relative to the execution path or an absolute path |
| -loglevel | DEBUG | Log output level, select from DEBUG, INFO, WARN, ERROR |

# How to exit the program

You can exit from the command line with `Ctrl + c`.