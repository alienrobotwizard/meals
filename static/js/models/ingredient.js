define([
    'jquery',
    'knockout'
], function ($, ko) {
    function Ingredient() {
        var self = this;
        self.id = ko.observable();
        self.name = ko.observable();
        self.description = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        self.apiPath = ko.computed(function() {return '/api/v1/ingredient/'+self.id();});

        self.initialize = function(data) {
            self.id(data.id);
            self.name(data.name);
            self.description(data.description);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);            
        };

        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self) };
            });
        };
    }
    
    return Ingredient;
});
