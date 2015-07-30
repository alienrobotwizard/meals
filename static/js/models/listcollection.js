define([
    'jquery',
    'knockout',
    'models/list'
], function ($, ko, List) {
    function ListCollection() {
        var self = this;
        self.lists = ko.observableArray([]);
        self.total = ko.observable();
        
        // Params for fetching
        self.paramOffset = ko.observable(0);
        self.paramLimit = ko.observable(10);
                
        self.apiPath = ko.computed(function() {
            var path = '/api/v1/list';
            var params = [];
            if (self.paramOffset()) { params.push('offset='+self.paramOffset()); }
            if (self.paramLimit()) { params.push('limit='+self.paramLimit()); }
            if (params.length > 0) {
                path += '?' + params.join('&');
            }
            return path;
        });
        
        self.initialize = function(data) {
            self.lists.removeAll();
            if (data.hasOwnProperty('lists')) {
                $.each(data.lists, function(i, listData) {
                    var list = new List();
                    list.initialize(listData);
                    self.lists.push(list);
                });
            }
            if (data.hasOwnProperty('total')) {
                self.total(data.total);
            }
        };

        
        self.removeList = function(l) {
            self.lists.remove(l);
        };                        

        self.push = function(list) {
            var match = ko.utils.arrayFirst(self.lists(), function(l) {
                return list.id() === l.id();
            });
            
            if (!match) {
                self.lists.push(list);
            }
        };
        
        self.fetch = function(cb) {
            $.getJSON(self.apiPath(), function (data) {                
                if (data) {
                    data.lists = data.hits;
                    self.initialize(data);
                }
                if (cb) { cb(self); }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                if (cb) { cb(self, jqXHR); }
            });
        };

        self.repeaterSource = function(options, cb) {            
            var offset = (options.pageIndex)*options.pageSize;
       
            self.paramLimit(options.pageSize);
            self.paramOffset(offset);
            
            self.fetch(function(fetched, jqXHR) {
                if (jqXHR) {
                    cb({}, jqXHR);
                } else {
                    cb({                
                        count: fetched.total(),
                        items: $.map(fetched.lists(), function(list, i) {
                            return {
                                title: '<a href="#list/'+list.id()+'">'+list.title()+'</a>',
                                days: list.totalDays(),
                                ingredients: list.count(),
                                created_at: list.createdAt()
                            }
                        }),
                        start: offset + 1,
                        end: offset + fetched.lists().length,
                        page: options.pageIndex,
                        pages: Math.ceil(fetched.total() / options.pageSize),
                        columns: [
                            {
                                label: 'Title',
                                property: 'title',
                                sortable: true
                            },
                            {
                                label: 'Days',
                                property: 'days',
                                sortable: true
                            },
                            {
                                label: 'Ingredients',
                                property: 'ingredients',
                                sortable: true
                            },
                            {
                                label: 'Created At',
                                property: 'created_at',
                                sortable: true
                            }
                        ]
                    });
                }
            });                        
        };
        
        self.each = function(cb) {
            $.each(self.lists(), function(i, list) {
                cb(list);
            });
        };
    }
    
    return ListCollection;
});
