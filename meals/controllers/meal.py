import cherrypy

from meals.model import Meal

log = cherrypy.log

class MealsController(object):

    @cherrypy.tools.json_out()
    def list_meals(self, title=None, order='asc', limit=100, offset=0):
        n = Meal.count(cherrypy.request.db, title=title)
        results = Meal.list(cherrypy.request.db, title=title, order=order,
                            limit=limit, offset=offset)
        return {'hits':[r.encode() for r in results], 'total':n}

    @cherrypy.tools.json_out()
    def get_meal(self, meal_id):
        meal =  Meal.get(cherrypy.request.db, meal_id)
        if not meal:
            log("No meal with id: [{}] found".format(meal_id))
            cherrypy.response.status = 404
            return {"error": "meal with id {} not found".format(meal_id)}
            
        return meal.encode()

    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def add_meal(self):
        data = cherrypy.request.json
        if 'meal' in data and all(k in data['meal'] for k in Meal.required_fields):
            meal = Meal.get_by_title(cherrypy.request.db, data['meal']['title'])
            if meal:
                cherrypy.response.status = 409
                return {'error': "Meal with title: [{}] already exists".format(data['meal']['title'])}

            ingredients = data['meal']['ingredients']
            if all( ('quantity' in ing) and ('id' in ing) for ing in ingredients):                                    
                meal = Meal.create(cherrypy.request.db, data['meal'])
                if meal:
                    return meal.encode()
                else:
                    log("Couldn't create meal for data: {}".format(data))
                    cherrypy.response.status = 500
                    return {'error': "Couldn't create meal"}
            else:
                cherrypy.response.status = 400
                return {'error': 'malformed request, meal data must include ("quantity" and "id")'}
                
        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include meal data with {}'.format(Meal.required_fields)}
        
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def update_meal(self, meal_id):
        data = cherrypy.request.json
        if 'meal' in data:
            updated = Meal.update(cherrypy.request.db, meal_id, data['meal'])
            return {"updated": updated, "meal": meal_id}
            
        cherrypy.response.status = 400
        return {'error': 'malformed request, request body must include meal data'}

    @cherrypy.tools.json_out()
    def delete_meal(self, meal_id):
        deleted = Meal.delete(cherrypy.request.db, meal_id)
        return {"deleted": deleted, "meal_id":meal_id}
