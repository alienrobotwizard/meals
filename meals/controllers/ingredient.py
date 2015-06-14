import cherrypy

from meals.model import Ingredient

log = cherrypy.log

class IngredientsController(object):
    
    @cherrypy.tools.json_out()
    def list_ingredients(self, name=None, order='asc', limit=100, offset=0):
        n = Ingredient.count(cherrypy.request.db, name=name)
        results = Ingredient.list(cherrypy.request.db, name=name, order=order,
                                  limit=limit, offset=offset)
        return {'hits':[r.encode() for r in results], 'total':n}

    @cherrypy.tools.json_out()
    def get_ingredient(self, ingredient_id):
        ingredient =  Ingredient.get(cherrypy.request.db, ingredient_id)
        if not ingredient:
            log("No ingredient with id: [{}] found".format(ingredient_id))
            cherrypy.response.status = 404
            return {"error": "ingredient with id {} not found".format(ingredient_id)}
            
        return ingredient.encode()

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def add_ingredient(self):
        data = cherrypy.request.json
        if 'ingredient' in data and all(k in data['ingredient'] for k in Ingredient.required_fields):
            ingredient = Ingredient.get_by_name(cherrypy.request.db, data['ingredient']['name'])
            if ingredient:
                cherrypy.response.status = 409
                return {'error': "Ingredient with name: [{}] already exists".format(data['ingredient']['name'])}
                
            ingredient = Ingredient.create(cherrypy.request.db, data['ingredient'])
            if ingredient:
                return ingredient.encode()
            else:
                log("Couldn't create ingredient for data: {}".format(data))
                cherrypy.response.status = 500
                return {'error': "Couldn't create ingredient"}
        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include ingredient data with {}'.format(Ingredient.required_fields)}
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_ingredient(self, ingredient_id):
        data = cherrypy.request.json
        if 'ingredient' in data:
            updated = Ingredient.update(cherrypy.request.db, ingredient_id, data['ingredient'])
            return {"updated": updated, "ingredient": ingredient_id}
            
        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include ingredient data'}

    @cherrypy.tools.json_out()
    def delete_ingredient(self, ingredient_id):
        deleted = Ingredient.delete(cherrypy.request.db, ingredient_id)
        return {"deleted": deleted, "ingredient_id":ingredient_id}

