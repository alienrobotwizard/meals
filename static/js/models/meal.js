define([
    'jquery',
    'knockout',
    'pager',
    'models/ingredientcollection'
], function ($, ko, pager, IngredientCollection) {
    
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

        self.editingTitle = ko.observable(false);
        self.editTitle = function() {self.editingTitle(true);}

        self.editingDescription = ko.observable(false);
        self.editDescription = function() {self.editingDescription(true); console.log(self.editingDescription());}

        self.editingRecipe = ko.observable(false);
        self.editRecipe = function() {self.editingRecipe(true);}
        
        self.editingIngredients = ko.observable(false);
        self.editIngredients = function() {self.editingIngredients(!self.editingIngredients());};
        
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

        self.serialize = function() {
            var data = {
                'meal': ko.toJS(self)
            };
            if (data.meal.hasOwnProperty('ingredients')) {
                data.meal.ingredients = $.map(data.meal.ingredients.ingredients, function(ingredient, i) {
                    return {'name': ingredient.name, 'quantity': ingredient.quantity.repr, 'id': ingredient.id};
                });
            }
            return data;
        };

        self.remove = function() {
            $.ajax({
                type: 'DELETE',
                url: self.apiPath()
            }).done(function(json) {
                pager.navigate('#meals');
            }).fail(function(json) {
            });
        };
        
        self.save = function(cb) {
            var data = self.serialize();

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
            var data = self.serialize();
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
