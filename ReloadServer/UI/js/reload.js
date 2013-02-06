define([
    'jquery',
    'underscore',
    'backbone',
    'router',
    'views/index/serverip',
    'views/index/serverinfo'
], function ($, _, Backbone, Router, ServerIpView, ServerInfoView) {

    var initialize = function () {

        // Setup Backbone to send RPC messages.
        var rpc = {
            rpc: function (options) {
                (this.sync || Backbone.sync).call(this, 'rpc', this, options);
            }
        };

        _.extend(Backbone.Collection.prototype, rpc);
        _.extend(Backbone.Model.prototype, rpc);

        Backbone.sync = function (method, model, options) {

            var resp,
            params = {};

            params.url          = options.url;
            params.data         = JSON.stringify(options.rpcMsg);
            params.contentType  = 'application/json';
            params.type         = 'POST';
            params.dataType     = 'json';

            // Only rpc calls are supported for now.
            if (method === 'rpc') {
                resp = $.ajax(_.extend(params, options));
            } else {
                console.log(method + ' is not supported.');
            }

            if (!resp) {
                options.error("Record not found");
            }
        };

        // Things to show in the top bar.
        var serverIpView = new ServerIpView();
        serverIpView.render();

        var serverInfoView = new ServerInfoView();
        serverInfoView.render();

        // Pass in our Router module and call it's initialize function
        Router.initialize();
    };

    return {
        initialize: initialize
    };
});
