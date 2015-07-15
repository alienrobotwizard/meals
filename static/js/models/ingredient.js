define([
    'jquery',
    'knockout',
    'pager',
    'models/quantity'
], function ($, ko, pager, Quantity) {
    function Ingredient() {
        var self = this;
        self.id = ko.observable();
        self.path = '/api/v1/ingredient';        
        self.name = ko.observable();
        self.description = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        // Only when part of a meal
        self.quantity = ko.observable(new Quantity());
        self.apiPath = ko.computed(function() {return self.path +'/'+self.id();});

        self.editingName = ko.observable(false);
        self.editName = function() {self.editingName(true);}
        
        self.editingDescription = ko.observable(false);
        self.editDescription = function() {self.editingDescription(true);}

        self.editingQuantity = ko.observable(false);
        self.editQuantity = function() {self.editingQuantity(true);}        
        
        self.editingNewQuantity = ko.observable(false);
        self.editNewQuantity = function() {self.editingNewQuantity(true);}
        
        self.initialize = function(data) {
            self.id(data.id);
            self.name(data.name);
            self.description(data.description);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);
            if (data.hasOwnProperty('quantity')) {
                var quantity = new Quantity();
                quantity.initialize(quantity.parse(data.quantity));
                self.quantity(quantity);
            }
        };

        self.saveChanges = function() {
            self.save();
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self) };
            });
        };

        self.remove = function() {
            $.ajax({
                type: 'DELETE',
                url: self.apiPath()
            }).done(function(json) {
                pager.navigate('#ingredients');
            }).fail(function(json) {
            });
        };

        self.save = function(cb) {
            data = {
                'ingredient': ko.toJS(self)
            };

            if (data.ingredient.hasOwnProperty('quantity')) {
                data.ingredient.quantity = data.ingredient.quantity.repr();
            };
            
            $.ajax({
                type: 'PUT',
                data: ko.toJSON(data),
                url: self.apiPath(),
                contentType: 'application/json'
            }).done(function(json) {
                if (cb) {cb()}
            }).fail(function(json) {
                console.log("Failed updating ingredient");
            });
        };
        
        self.create = function(cb) {
            data = {
                'ingredient': ko.toJS(self)
            };

            if (data.ingredient.hasOwnProperty('quantity')) {
                data.ingredient.quantity = data.ingredient.quantity.repr();
            };
            
            $.ajax({
                type: 'POST',
                data: ko.toJSON(data),
                url: self.path,
                contentType: 'application/json'
            }).done(function(json) {
                if (cb) {cb()}
            }).fail(function(json) {
                console.log("Failed creating ingredient");
            });
        };
    }
    
    return Ingredient;
});
