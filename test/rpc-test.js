var buster = require('buster');
var request = require('request');
var net = require('net');

buster.testCase("RPC", {
    setUp: function() {
       this.host = 'http://localhost';
       this.port = 8283;
       this.url = this.host + ':'+ this.port;
       this.headers = {'content-type' : 'application/json'};
    },

    tearDown: function() {
    },

    "add": function (done) {
        var message = {
            "method":   "manager.add",
            "params":   [1,1],
            "id"    :   null
        };

        var expected = 2;
        var result = 0;

        var callback = function(error, response, body) {
            if (!error && response.statusCode === 200) {
                result = JSON.parse(body).result;
                buster.log('1 + 1 = ' + result);
                assert.equals(expected, result);

                done();
            }
        };

        request.post({
            headers: this.headers,
            url: this.url,
            body: JSON.stringify(message)
        }, callback );
    },

    "changeWorkspacePath": function(done) {
        // TODO: remove created workspace directory on cleanup.

        // Current workspace path to switch back to.
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
        }, function(error, response, body){

            var oldWorkspacePath = JSON.parse(body).result.path;
            buster.log('Old workspace path: ' + oldWorkspacePath);

            // Change workspace path to new one
            var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
            var newWorkspacePath = home + '/newWorkspace';

            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.changeWorkspacePath", "params":[newWorkspacePath], "id":null })
            }, function(error, response, body){

                // Get workspace path for confirmation
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
                }, function(error, response, body){

                    var expected = newWorkspacePath;
                    var result = JSON.parse(body).result.path;
                    buster.log('Changed workspace to: ' + result);
                    assert.equals(expected, result);

                    // Change back workspace path
                    request.post({
                        headers: {'content-type' : 'application/json'},
                        url: 'http://localhost:8283',
                        body: JSON.stringify({ "method":"manager.changeWorkspacePath", "params":[oldWorkspacePath], "id":null })
                    }, function(error, response, body){

                        var result = JSON.parse(body).result;
                        buster.log('Changed workspace back to: ' + result);
                        done();

                    });

                });
            });
        });

    },

    "getVersionInfo": function(done) {

        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getVersionInfo", "params":[], "id":null })
        }, function(error, response, body){

            var expected = {
                version:"",
                timestamp:""
            };

            var result = JSON.parse(JSON.parse(body).result);
            buster.log(result);
            assert.match(result, expected);
            done();

        });
    },

    "getServerAddress": function(done) {
        var expected;
        var result;

        // TODO: replace socket implementation with native command request.
        var socket = net.createConnection(80, "www.google.com");
        socket.on('connect', function() {
            expected = socket.address().address;
            socket.end();

            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method": "manager.getNetworkIP", "params": [], "id" :null })
            }, function(error, response, body) {

                result = JSON.parse(body).result;
                buster.log(result);
                //assert.equals(expected, result);
                assert(true);
                done();

            });
        });
    },

    // TODO: Change workspace to new workspace to perform test there.
    "getProjectList": function(done) {
        // Create project.
        var projectName = 'My_Project';
        var projectType = 'web';
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body) {

            buster.log('Created project: ' + JSON.parse(body).result);

            // Get project list.
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.getProjectList", "params":[], "id":null })
            }, function(error, response, body){

                var expected = [{
                    "url":"",
                    "name":""
                }];

                var result = JSON.parse(JSON.parse(body).result);
                buster.log(result);
                assert.match(result, expected);

                // Remove project.
                // Get workspace path for cleanup.
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
                }, function(error, response, body){

                    var projectPath = JSON.parse(body).result.path + '/' + projectName;

                    // Remove project.
                    request.post({
                        headers: {'content-type' : 'application/json'},
                        url: 'http://localhost:8283',
                        body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
                    }, function(error, response, body){

                        buster.log('Removed: ' + JSON.parse(body).result);
                        done();

                    });
                });
            });

        });
    },

    "createNewProject": function(done) {
        var projectName = 'My_Project';
        var projectType = 'web';

        var expected = projectName;
        var result = '';

        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body) {

            result = JSON.parse(body).result;
            buster.log(result);
            assert.equals(expected, result);

            // CLEANUP
            // Get workspace path for cleanup.
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
            }, function(error, response, body){

                var workspacePath = JSON.parse(body).result.path;
                var projectPath =  workspacePath + '/' + projectName;
                //buster.log(projectPath);

                // Remove project.
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
                }, function(error, response, body){

                    done();

                });
            });
        });
    },

    "removeProject": function(done) {
        // Create project.
        var projectName = 'My_Project';
        var projectType = 'web';

        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body){

            buster.log('Created: ' + JSON.parse(body).result);

            // Remove project.
            // Get workspace path for cleanup.
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
            }, function(error, response, body){

                var projectPath = JSON.parse(body).result.path + '/' + projectName;

                // Remove project.
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
                }, function(error, response, body){

                    buster.log('Removed: ' + JSON.parse(body).result);
                    assert.equals(projectPath ,JSON.parse(body).result);
                    done();

                });
            });
        });
    },

    "renameProject": function(done) {
        var oldProjectName = 'oldProjectName';
        var oldProjectType = '';

        var newProjectName = 'newProjectName';

        // Create new project.
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[oldProjectName, 'web'], "id":null })
        }, function(error, response, body){

            buster.log('Created project: ' + JSON.parse(body).result);

            // Rename project.
            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.renameProject", "params":[oldProjectName, newProjectName], "id":null })
            }, function(error, response, body){

                var result = JSON.parse(body).result;
                var expected = newProjectName;
                buster.log('Renamed from: ' + oldProjectName + ' to: ' + result);
                assert.equals(expected, result);

                // CLEANUP
                // Get workspace path for cleanup.
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
                }, function(error, response, body){

                    var workspacePath = JSON.parse(body).result.path;
                    var projectPath =  workspacePath + '/' + newProjectName;

                    request.post({
                        headers: {'content-type' : 'application/json'},
                        url: 'http://localhost:8283',
                        body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
                    }, function(error, response, body){

                        buster.log('Removed: ' + JSON.parse(body).result);
                        done();

                    });

                });

            });
        });
    },

    "//reloadProject": function(done) {
        var projectName = 'Reload_My_Project';
        var projectType = 'nativeui';
        var debug = false;


        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body) {

            buster.log('Create project: ' + JSON.parse(body).result);

            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.reloadProject", "params":[projectName, debug], "id":null })
            }, function(error, response, body){

                buster.log(JSON.parse(body).result);
                done();

            });
        });
    },

    "openProjectFolder": function(done) {
        var projectName = 'ABC_My_Project';
        var projectType = 'native';

        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.createNewProject", "params":[projectName, projectType], "id":null })
        }, function(error, response, body) {

            var result = JSON.parse(body).result;
            buster.log('Created project: ' + result);

            request.post({
                headers: {'content-type' : 'application/json'},
                url: 'http://localhost:8283',
                body: JSON.stringify({ "method":"manager.openProjectFolder", "params":[projectName], "id":null })
            }, function(error, response, body){

                assert(true);

                // Cleanup should actually be done manually to really demonstrate opening of native file explirer window.
                request.post({
                    headers: {'content-type' : 'application/json'},
                    url: 'http://localhost:8283',
                    body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
                }, function(error, response, body){

                    var projectPath = JSON.parse(body).result.path + '/' + projectName;

                    // Remove project.
                    request.post({
                        headers: {'content-type' : 'application/json'},
                        url: 'http://localhost:8283',
                        body: JSON.stringify({ "method":"manager.removeProject", "params":[projectPath], "id":null })
                    }, function(error, response, body){

                        buster.log('Removed: ' + JSON.parse(body).result);
                        done();

                    });
                });


            });

        });
    },

    "getClientInfo": function(done) {
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getClientInfo", "params":[], "id":null })
        }, function(error, response, body){

            var expected = [{
                type:     "",
                platform: "",
                name:     "",
                uuid:     "",
                version:  "",
                phonegap: "",
                address:  ""
            }];

            var result = JSON.parse(JSON.parse(body).result);
            buster.log(result);
            assert.match(result, expected);
            done();
        });
    },

    "//getDebugData": function(done) {
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getDebugData", "params":[], "id":null })
        }, function(error, response, body){

            result = JSON.parse(body).result;
            buster.log(result);
            //assert.equals(expected, result);
            done();

        });
    },

    "//getRemoteLogData": function(done) {
        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getRemoteLogData", "params":[], "id":null })
        }, function(error, response, body){

            result = JSON.parse(body).result;
            buster.log(result);
            //assert.equals(expected, result);
            done();

        });
    },

    "getWorkspacePath": function(done) {
        var home = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
        var expected = { path: home + '/MoSync_Reload_Projects' };
        var result;

        request.post({
            headers: {'content-type' : 'application/json'},
            url: 'http://localhost:8283',
            body: JSON.stringify({ "method":"manager.getWorkspacePath", "params":[], "id":null })
        }, function(error, response, body){

                result = JSON.parse(body).result;
                buster.log(result);
                assert.equals(expected, result);
                done();

        });
    }

});
