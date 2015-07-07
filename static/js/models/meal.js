define([
    'jquery',
    'knockout',
    'models/ingredientcollection'
], function ($, ko, IngredientCollection) {
    
    function Meal() {
        var self = this;
        self.path = '/api/v1/meal';
        self.id = ko.observable();
        self.title = ko.observable();
        self.description = ko.observable();
        self.recipe = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        self.ingredients = ko.observable(new IngredientCollection());
        self.apiPath = ko.computed(function() {return self.path+'/'+self.id();});

        self.initialize = function(data) {
            self.id(data.id);
            self.title(data.title);
            self.description(data.description);
            self.recipe(data.recipe);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);
            if (data.hasOwnProperty('ingredients')) {                
                self.ingredients().initialize(data);
            }
        };

        self.saveChanges = function() {
            self.save();
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self); }
            });
        };

        self.save = function(cb) {
            data = {
                'meal': ko.toJS(self)
            };

            $.ajax({
                type: 'PUT',
                data: ko.toJSON(data),
                url: self.apiPath(),
                contentType: 'application/json'
            }).done(function(json) {
                if (cb) {cb()}
            }).fail(function(json) {
                console.log("Failed updating meal");
            });
        };

        self.create = function(cb) {
            data = {
                'meal': ko.toJS(self)
            };

            $.ajax({
                type: 'POST',
                data: ko.toJSON(data),
                url: self.path,
                contentType: 'application/json'
            }).done(function(json) {
                if (cb) {cb()}
            }).fail(function(json) {
                console.log("Failed creating meal");
            });
        };
    }
    
    return Meal;
});
