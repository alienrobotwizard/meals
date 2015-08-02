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

        self.combineIngredientsByID = function() {
            var groups = {};
            self.ingredients().each(function(ingredient) {
                if (group.hasOwnProperty(ingredient.id())) {
                    groups[ingredient.id()].quantity().add(ingredient.quantity());
                } else {
                    groups[ingredient.id()] = ingredient;
                }
            });

            var result = [];
            for (var ingID in groups) {
                result.push[groups[ingID]];
            }
            return result;
        };
        
        self.combineIngredientsByMeal = function() {
            var groups = {};
            self.ingredients().each(function(ingredient) {
                if (groups.hasOwnProperty(ingredient.mealID())) {
                    var mealIngredients = groups[ingredient.mealID()];
                    if (mealIngredients.hasOwnProperty(ingredient.id())) {
                        mealIngredients[ingredient.id()].quantity().add(ingredient.quantity());
                    } else {
                        mealIngredients[ingredient.id()] = ingredient;
                    }
                } else {
                    var ingID = ingredient.id();
                    groups[ingredient.mealID()] = {};
                    groups[ingredient.mealID()][ingID] = ingredient;
                }
            });

            var result = [];
            for (var mealID in groups) {
                var mealIngredients = groups[mealID];
                for (var ingredientID in mealIngredients) {
                    var ingredient = mealIngredients[ingredientID];
                    result.push({
                        'name': ingredient.name(),
                        'quantity': ingredient.quantity().repr(),
                        'meal': mealID,
                        'checked': ingredient.checked(),
                        'id': ingredientID
                    });
                }
            }
            return result;
        };
        
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
            
            if (data.list.hasOwnProperty('startDate')) {
                data.list.start_date = data.list.startDate;
            }

            if (data.list.hasOwnProperty('endDate')) {
                data.list.end_date = data.list.endDate;
            }
            
            if (data.list.hasOwnProperty('ingredients')) {                
                data.list.ingredients = self.combineIngredientsByMeal();
            }
            return data;
        };

        self.remove = function(e, cb) {
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
            console.log(data);
            $.ajax({
                type: 'POST',
                data: ko.toJSON(data),
                url: self.path,
                contentType: 'application/json'
            }).done(function(json) {
                self.id(json.id);
                if (cb) {cb()}
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) {cb(jqXHR);}
            });
        };
    }
    
    return List;
});
