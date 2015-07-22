#!/usr/bin/env python
import os
import nltk
import dropbox
import cherrypy

from meals.plugin import SAEnginePlugin, SATool
from meals.controllers.day import DaysController
from meals.controllers.meal import MealsController
from meals.controllers.user import UsersController
from meals.controllers.dropboxcontroller import DropboxController
from meals.controllers.ingredient import IngredientsController
from meals.parser import Parser, RecipeAdapter

HERE = os.path.dirname(os.path.abspath(__file__))

def validate_auth():
    if not 'Authorization' in cherrypy.request.headers:
        raise cherrypy.HTTPError('403 Forbidden')
        
    auth = cherrypy.request.headers['Authorization']
    if not auth:
        raise cherrypy.HTTPError('403 Forbidden')
        
    token = auth.split()[1]
    if not UsersController.valid_token(token):
        raise cherrypy.HTTPError('403 Forbidden')
    
def get_app():
    d = cherrypy.dispatch.RoutesDispatcher()

    d.connect(name='days', route='/api', controller=DaysController)
    d.connect(name='meals', route='/api', controller=MealsController)
    d.connect(name='users', route='/user', controller=UsersController)
    d.connect(name='dropbox', route='/api', controller=DropboxController)
    d.connect(name='ingredients', route='/api', controller=IngredientsController)

    with d.mapper.submapper(path_prefix='/api/v1', controller='dropbox') as m:
        m.connect('upload_dropbox', '/dropbox', action='upload')

    with d.mapper.submapper(path_prefix='/user', controller='users') as m:
        m.connect('auth', '/authenticate', action='authenticate', conditions=dict(method=['POST']))
        
    with d.mapper.submapper(path_prefix='/api/v1', controller='meals') as m:
        m.connect('list_meals', '/meal', action='list_meals', conditions=dict(method=['GET']))
        m.connect('new_meal_from_url', '/meal/from_url', action='add_meal_from_url')
        m.connect('get_meal', '/meal/{meal_id}', action='get_meal', conditions=dict(method=['GET']))
        m.connect('update_meal', '/meal/{meal_id}', action='update_meal', conditions=dict(method=['PUT']))
        m.connect('add_meal', '/meal', action='add_meal', conditions=dict(method=['POST']))
        m.connect('delete_meal', '/meal/{meal_id}', action='delete_meal', conditions=dict(method=['DELETE']))

    with d.mapper.submapper(path_prefix='/api/v1', controller='days') as m:
        m.connect('list_days', '/day', action='list_days', conditions=dict(method=['GET']))
        m.connect('get_day', '/day/{day_id}', action='get_day', conditions=dict(method=['GET']))
        m.connect('update_day', '/day/{day_id}', action='update_day', conditions=dict(method=['PUT']))
        m.connect('delete_day', '/day/{day_id}', action='delete_day', conditions=dict(method=['DELETE']))

    with d.mapper.submapper(path_prefix='/api/v1', controller='ingredients') as m:
        m.connect('list_ingredients', '/ingredient', action='list_ingredients', conditions=dict(method=['GET']))
        m.connect('get_ingredient', '/ingredient/{ingredient_id}', action='get_ingredient', conditions=dict(method=['GET']))
        m.connect('update_ingredient', '/ingredient/{ingredient_id}', action='update_ingredient', conditions=dict(method=['PUT']))
        m.connect('add_ingredient', '/ingredient', action='add_ingredient', conditions=dict(method=['POST']))
        m.connect('delete_ingredient', '/ingredient/{ingredient_id}', action='delete_ingredient', conditions=dict(method=['DELETE']))

    server_cfg = {
        'server.socket_host': '0.0.0.0',
        'server.socket_port': int(os.environ.get('PORT')),
        'tools.db.on': True,        
        'tools.gzip.on': True,
        'tools.gzip.mime_types': ["application/json"],
        'tools.staticdir.root': HERE+'/../'
    }

    cherrypy.config.update(server_cfg)
    
    config = {
        '/': {
            'request.dispatch': d
        },
        '/web': {
            'tools.staticdir.dir': 'static',
            'tools.staticdir.on': True,
            'tools.staticdir.index': 'index.html'            
        },
        '/api': {
            'tools.validate_auth.on': True
        }
    }

    cherrypy.engine.autoreload.unsubscribe()
    app = cherrypy.tree.mount(root=None, config=config)
    return app
    
def start():
    app = get_app()

    SAEnginePlugin(cherrypy.engine, os.environ.get('DATABASE_URL')).subscribe()
    cherrypy.tools.db = SATool()
    cherrypy.tools.validate_auth = cherrypy.Tool('before_handler', validate_auth)
    
    # idempotent
    nltk.download('wordnet')

    UsersController.secret = os.environ.get('SECRET_TOKEN')
    DropboxController.client = dropbox.client.DropboxClient(os.environ.get('DROPBOX_API_KEY'))
    MealsController.meal_parser = Parser()
    MealsController.recipe_adapter = RecipeAdapter
    
    cherrypy.engine.start()
    cherrypy.engine.block()
    cherrypy.quickstart(app)

    
if __name__ == '__main__':
    start()    
