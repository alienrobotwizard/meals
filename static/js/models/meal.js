define([
    'jquery',
    'knockout',
    'models/ingredientcollection'
], function ($, ko, IngredientCollection) {
    
    function Meal() {
        var self = this;
        self.id = ko.observable();
        self.title = ko.observable();
        self.description = ko.observable();
        self.recipe = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        self.ingredients = ko.observable(new IngredientCollection());
        self.apiPath = ko.computed(function() {return '/api/v1/meal/'+self.id();});

        self.initialize = function(data) {
            self.id(data.id);
            self.title(data.title);
            self.description(data.description);
            self.recipe(data.recipe);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);
            self.ingredients().initialize(data);            
        };

        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self) };
            });
        };
    }
    
    return Meal;
});
