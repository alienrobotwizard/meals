define([
    'jquery',
    'knockout',
    'pager',
    'moment',
    'fullcalendar',
    'datetimepicker',
    'select2',
    'models/day',
    'models/meal',
    'models/list',
    'models/ingredient',
    'models/daycollection',
    'models/listcollection',
    'models/mealcollection',
    'models/ingredientcollection'
], function ($, ko, pager, moment, fullcalendar, datetimepicker, select2,
             Day, Meal, List, Ingredient, DayCollection, ListCollection, MealCollection, IngredientCollection) {
    $(function () {
        function User() {
            var self = this;
            
            self.email = ko.observable();
            self.password = ko.observable();

            self.isLoggedIn = function(page, route, callback) {
                // This will only succeed if the user has a valid jwt
                $.getJSON('/api/v1/day', function (data) {
                    callback();
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    window.location.href = '#login';
                });
            };
            
            self.serialize = ko.computed(function() {
                var data = {
                    'user': ko.toJS(self)
                };
                return data;
            });
            
            self.login = function() {
                var data = self.serialize();
                $.ajax({
                    type: 'POST',
                    data: ko.toJSON(data),
                    url: '/user/authenticate',
                    contentType: 'application/json'
                }).done(function(json) {
                    pager.navigate('plan/calendar');
                }).fail(function(jqXHR, textStatus, errorThrown) {
                    console.log(textStatus);
                });           
            };            
        };
        
        function AppViewModel() {
            var self = this;

            self.calendar = ko.observable($('#calendar'));
            self.dayModal = ko.observable($('#addMealsToDay'));
            self.ingredientRepeater = ko.observable($(null));
            self.mealRepeater = ko.observable($(null));
            self.listRepeater = ko.observable($(null));
            self.ingredientSelector = ko.observable($(null));

            self.uploading = ko.observable(false);
            self.listStartString = ko.observable();
            self.listEndString = ko.observable();
            
            self.user = ko.observable(new User());
            self.day = ko.observable(new Day());
            self.meal = ko.observable(new Meal());
            self.list = ko.observable(new List());
            self.ingredient = ko.observable(new Ingredient());
            self.dayCollection = ko.observable(new DayCollection());
            self.listCollection = ko.observable(new ListCollection());
            self.mealCollection = ko.observable(new MealCollection());
            self.ingredientCollection = ko.observable(new IngredientCollection());            
            
            self.initialize = function() {
                $('#dtBox').DateTimePicker();
                self.calendar().fullCalendar({
                    // selectable: true,
                    events: function(start, end, tz, cb) {
                        self.dayCollection().fetchEvents(start, end, tz, function(eventData, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(eventData);
                            }
                        });
                    },                        
                    dayClick: self.dayClick
                    // select: self.dayCollection().updateShoppingList                    
                });
                self.day().meals().createMealSelector($('#inputDayMeals'));
            };
                        
            self.dayClick = function(date, event, view) {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                } else {
                    $(this).addClass('selected');
                }
                self.day().id(date.format('YYYYMMDD'));
                self.day().date(date);
                self.day().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        self.dayModal().modal('show');
                    }
                });
            };

            self.hasListDates = ko.computed(function() {
                if (self.listStartString() && self.listStartString() != '' &&
                    self.listEndString() && self.listEndString() != '') {
                    return true;
                } 
                return false;
            });
            
            self.newShoppingList = function(e) {
                var startMoment = moment(self.listStartString(), 'DD-MM-YYYY');
                var endMoment = moment(self.listEndString(), 'DD-MM-YYYY');

                self.refreshList();
                self.list().startDate(startMoment.format('YYYYMMDD'));
                self.list().endDate(endMoment.format('YYYYMMDD'));
                
                self.dayCollection().paramStartDay(startMoment.format('YYYYMMDD'));
                self.dayCollection().paramEndDay(endMoment.add(1, 'days').format('YYYYMMDD'));
                self.dayCollection().fetch(function(fetched, jqXHR) {                    
                    $.each(fetched.days(), function(i, day) {
                        day.meals().each(function(meal) {
                            meal.ingredients().each(function(ingredient) {
                                ingredient.mealID(meal.id());
                                self.list().ingredients().ingredients.push(ingredient);
                            });
                        });
                    });

                    self.list().create(function(jqXHR) {
                        if (jqXHR && jqXHR.status == 403) {
                            pager.navigate('login');
                        } else if (!jqXHR) {
                            e.reset();
                            self.listStartString('');
                            self.listEndString('');
                            pager.navigate('list/'+self.list().id());
                        }
                    });                
                });                                
            };
            
            self.formatShoppingListTODO = function() {
                function capitalizeFirstLetter(string) {
                    return string.charAt(0).toUpperCase() + string.slice(1);
                };
                
                var content = "";
                $.each(self.dayCollection().shoppingList(), function(index, row) {
                    var mealContext = $.map(row.meals, function(meal, i) {
                        return '+'+$.map(meal.split(' '), function(word, j) {
                            return capitalizeFirstLetter(word);
                        }).join('');
                    }).join(' ');
                    content += row.quantity().repr()+'  '+row.name+' @shopping '+mealContext+'\n';
                });
                return content;
            };
                        

            self.uploadShoppingList = function() {
                self.uploading(true);
                var data = {
                    'body': self.formatShoppingListTODO() 
                };
                $.ajax({
                    type: 'PUT',
                    data: ko.toJSON(data),
                    url: '/api/v1/dropbox',
                    contentType: 'application/json'
                }).done(function(json) {
                    self.uploading(false);
                }).fail(function(json) {
                    self.uploading(false);
                });
            };
                        
            self.refresh = function() {
                self.calendar().fullCalendar('refetchEvents');
            };

            self.refreshIngredients = function() {
                self.ingredientRepeater().repeater('render');
                self.ingredient().initialize({});
            };

            self.refreshMeals = function() {
                self.mealRepeater().repeater('render');
                self.meal().initialize({});
                self.meal().ingredients().initialize({});
            };

            self.refreshList = function() {
                self.list().initialize({});
                self.list().ingredients().initialize({});
            };
            
            self.refreshLists = function() {
                self.listRepeater().repeater('render');
                self.refreshList();
            };

            self.fetchIngredient = function(page) {
                self.ingredient().id(page.page.id());
                self.ingredient().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    }
                });                
            };

            self.fetchMeal = function(page) {
                self.meal().id(page.page.id());
                self.meal().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.ingredients().each(function(ingredient) {
                            ingredient.quantity().createUnitSelector($('#inputMealIngredientQuantity-'+ingredient.id()));
                        });
                    }
                });                
            };

            self.fetchList = function(page) {
                self.refreshList();
                self.list().id(page.page.id());
                self.list().fetch(function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.ingredients().each(function(ingredient) {
                            ingredient.quantity().createUnitSelector($('#inputListIngredientQuantity-'+ingredient.id()));
                        });
                    }
                });                
            };
            
            self.addIngredient = function(e) {
                self.ingredient().create(function(jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        self.refreshIngredients();
                        e.reset();
                    }
                });                
            };

            self.addMeal = function(e) {
                self.meal().create(function(jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) { 
                        self.refreshMeals();
                        e.reset();
                        self.meal().ingredients().initialize({});
                    }
                });
            };
            
            self.initIngredientRepeater = function() {
                self.ingredientRepeater($('#ingredientsRepeater'));
                self.ingredientRepeater().repeater({
                    staticHeight: false,
                    dataSource: function(options, cb) {
                        self.ingredientCollection().repeaterSource(options, function(data, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(data);
                            }
                        });
                    }
                });
            };

            self.initMealPage = function() {
                self.meal().ingredients().createIngredientSelector($('#inputMealIngredients'), function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.quantity().createUnitSelector($('#inputMealIngredientQuantity-'+fetched.id()));
                    }
                });
            };
            
            self.initMealsPage = function() {
                // Set up the repeater (list of all meals)
                self.mealRepeater($('#mealsRepeater'));
                self.mealRepeater().repeater({
                    staticHeight: false,
                    dataSource: function(options, cb) {
                        self.mealCollection().repeaterSource(options, function(data, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(data)
                            }
                        });
                    }
                });

                // Set up the ingredient selector on the new_meal form
                self.ingredientSelector($('#ingredientSelector'));
                self.meal().ingredients().createIngredientSelector(self.ingredientSelector(), function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.quantity().createUnitSelector($('#newMealIngredientQuantity-'+fetched.id()));
                    }
                });
            };

            self.initListPage = function() {
                self.list().ingredients().createIngredientSelector($('#inputListIngredients'), function(fetched, jqXHR) {
                    if (jqXHR && jqXHR.status == 403) {
                        pager.navigate('login');
                    } else if (!jqXHR) {
                        fetched.quantity().createUnitSelector($('#inputListIngredientQuantity-'+fetched.id()));
                    }
                });
            };
            
            self.initListsPage = function() {
                // Set up the repeater (list of all shopping lists)
                self.listRepeater($('#listsRepeater'));
                self.listRepeater().repeater({
                    staticHeight: false,
                    dataSource: function(options, cb) {
                        self.listCollection().repeaterSource(options, function(data, jqXHR) {
                            if (jqXHR && jqXHR.status == 403) {
                                pager.navigate('login');
                            } else if (!jqXHR) {
                                cb(data)
                            }
                        });
                    }
                });                
            };
        }

        viewModel = new AppViewModel();
        viewModel.initialize();

        pager.extendWithPage(viewModel);
        ko.applyBindings(viewModel);
        pager.start();

        // Safari fix
        if (typeof String.prototype.endsWith !== 'function') {
            String.prototype.endsWith = function(suffix) {
                return this.indexOf(suffix, this.length - suffix.length) !== -1;
            };
        }
    });
});
