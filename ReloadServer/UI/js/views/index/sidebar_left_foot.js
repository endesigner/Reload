define([
    'jquery',
    'underscore',
    'backbone',
    'views/devices/main',
    'text!../../../templates/index/sidebar_left_foot.html'
], function($, _, Backbone, DevicesView, template){

    var SidebarLeftFootView = Backbone.View.extend({

        initialize: function (options) {
            this.parent = options.parent;
            console.log(options);
            _.bindAll(this, 'render');
        },

        render: function () {

            var devicesView = new DevicesView( {parent: this.parent} );
            var compiledTemplate = _.template( template, {} );
            var o = $(compiledTemplate).append( devicesView.render() );
            return this.$el.html( o );
        }
    });

    return SidebarLeftFootView;
});
