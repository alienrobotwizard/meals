import cherrypy

from meals.model import List

log = cherrypy.log

class ListsController(object):
    
    @cherrypy.tools.json_out()
    def list_lists(self, order='asc', limit=100, offset=0):
        n = List.count(cherrypy.request.db)
        results = List.list(cherrypy.request.db, order=order,
                            limit=limit, offset=offset)
        return {'hits':[r.encode() for r in results], 'total':n}

    @cherrypy.tools.json_out()
    def get_list(self, list_id):
        l =  List.get(cherrypy.request.db, list_id)
        if not l:
            log("No list with id: [{}] found".format(list_id))
            cherrypy.response.status = 404
            return {"error": "list with id {} not found".format(list_id)}
            
        return l.encode()

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def add_list(self):
        data = cherrypy.request.json
        if 'list' in data and all(k in data['list'] for k in List.required_fields):
            l = List.get_by_dates(cherrypy.request.db, data['list']['start_date'],
                                  data['list']['end_date'])
            if l:
                cherrypy.response.status = 409
                return {'error': "List with start_date: [{}] and end_date: [{}] already exists".format(
                    data['list']['start_date'], data['list']['end_date'])}

            ingredients = data['list']['ingredients']
            if all( ('quantity' in ing) and ('id' in ing) and ('meal' in ing) for ing in ingredients):                                    
                l = List.create(cherrypy.request.db, data['list'])
                if l:
                    return l.encode()
                else:
                    log("Couldn't create list for data: {}".format(data))
                    cherrypy.response.status = 500
                    return {'error': "Couldn't create list"}
            else:
                cherrypy.response.status = 400
                return {'error': 'malformed request, ingredient data must include ("quantity" and "id")'}
                
        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include list data with {}'.format(List.required_fields)}
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_list(self, list_id):
        data = cherrypy.request.json
        if 'list' in data:
            updated = List.update(cherrypy.request.db, list_id, data['list'])
            return {"updated": updated, "list": list_id}
            
        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include list data'}

    @cherrypy.tools.json_out()
    def delete_list(self, list_id):
        deleted = List.delete(cherrypy.request.db, list_id)
        return {"deleted": deleted, "list_id":list_id}
