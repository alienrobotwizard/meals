define([
    'jquery',
    'knockout',
    'pager',
    'moment',
    'models/ingredientcollection'
], function ($, ko, pager, moment, IngredientCollection) {
    
    function List() {
        var self = this;
        self.path = '/api/v1/list';
        self.id = ko.observable();
        self.startDate = ko.observable();
        self.endDate = ko.observable();
        self.createdAt = ko.observable();
        self.updatedAt = ko.observable();
        self.ingredients = ko.observable(new IngredientCollection());
        
        self.apiPath = ko.computed(function() {return self.path+'/'+self.id();});
        
        self.editingIngredients = ko.observable(false);
        self.editIngredients = function() {self.editingIngredients(!self.editingIngredients());};

        self.title = ko.computed(function() {
            var s = moment(self.startDate()).format('ddd, MMMM Do');
            var e = moment(self.endDate()).format('ddd, MMMM Do');
            return "List for "+s+" - "+e;
        });

        self.totalDays = ko.computed(function() {
            var s = moment(self.startDate());
            var e = moment(self.endDate());
            return e.diff(s, 'days');
        });

        self.count = ko.computed(function() {
            return self.ingredients().ingredients().length;
        });
        
        self.initialize = function(data) {
            self.id(data.id);
            self.startDate(data.start_date);
            self.endDate(data.end_date);
            self.createdAt(data.created_at);
            self.updatedAt(data.updated_at);
            if (data.hasOwnProperty('ingredients')) {
                self.ingredients().initialize(data);
            }
        };

        self.saveChanges = function(vm) {
            self.save(function(jqXHR) {
                if (jqXHR && jqXHR.status == 403) {
                    pager.navigate('login');
                }
            });
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {
                if (data) { self.initialize(data); }
                if (cb) { cb(self); }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) { cb(self, jqXHR); }
            });
        };

        self.serialize = function() {
            var data = {
                'list': ko.toJS(self)
            };
            if (data.list.hasOwnProperty('ingredients')) {
                data.list.ingredients = $.map(data.list.ingredients.ingredients, function(ingredient, i) {
                    return {'name': ingredient.name, 'quantity': ingredient.quantity.repr, 'id': ingredient.id};
                });
            }
            return data;
        };

        self.remove = function(cb) {
            $.ajax({
                type: 'DELETE',
                url: self.apiPath()
            }).done(function(json) {
                pager.navigate('#lists');
                if (cb) { cb(); }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) { cb(jqXHR); }
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
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) {cb(jqXHR);}
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
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) {cb(jqXHR);}
            });
        };
    }
    
    return List;
});
